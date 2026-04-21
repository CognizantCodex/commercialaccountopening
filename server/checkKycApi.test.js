import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectMissingCheckKycFields,
  createCheckKycPayload,
  processCheckKycRequest,
  submitCheckKycApplication,
} from "./checkKycApi.js";
import { createValidWorkspace } from "./testUtils.js";

describe("checkKycApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CHECK_KYC_API_URL;
  });

  it("creates a normalized payload from a valid workspace", () => {
    const workspace = createValidWorkspace();

    const payload = createCheckKycPayload(workspace);

    expect(payload.primaryContact.phone).toBe("2125550199");
    expect(payload.beneficialOwners[0].phone).toBe("6465550123");
    expect(payload.addresses.operatingLine1).toBe("100 Market Street");
    expect(payload.addresses.operatingPostalCode).toBe("10001");
    expect(payload.bankingProfile.requestedProducts).toEqual([
      "Operating account",
      "ACH origination",
    ]);
  });

  it("reports missing required fields for incomplete CheckKYC payloads", () => {
    const payload = createCheckKycPayload(
      createValidWorkspace({
        companyInfo: {
          legalName: "",
        },
        beneficialOwners: [
          {
            id: "owner-1",
            fullName: "",
            title: "Managing Member",
            ownershipPercentage: "65",
            email: "jordan.lee@northwind.example.com",
            phone: "",
            isAuthorizedSigner: true,
          },
        ],
      }),
    );

    expect(collectMissingCheckKycFields(payload)).toEqual(
      expect.arrayContaining([
        "companyInfo.legalName",
        "beneficialOwners[0].fullName",
        "beneficialOwners[0].phone",
      ]),
    );
  });

  it("returns a pass result for a valid CheckKYC request", async () => {
    const payload = createCheckKycPayload(createValidWorkspace());

    await expect(processCheckKycRequest(payload)).resolves.toMatchObject({
      status: "pass",
      missingFields: [],
    });
  });

  it("returns a fail result when the legal name triggers a screening failure", async () => {
    const payload = createCheckKycPayload(
      createValidWorkspace({
        companyInfo: {
          legalName: "Failing Imports LLC",
        },
      }),
    );

    await expect(processCheckKycRequest(payload)).resolves.toMatchObject({
      status: "fail",
      message: "KYC screening failed for Failing Imports LLC.",
    });
  });

  it("returns a fail result when the payload is missing owners and required fields", async () => {
    await expect(
      processCheckKycRequest({
        brandName: "Cognizant",
        formTitle: "Corporate Account Opening Application",
        companyInfo: {},
        primaryContact: {},
        addresses: {},
        bankingProfile: {},
        beneficialOwners: [],
        documents: {},
        declarations: {},
      }),
    ).resolves.toMatchObject({
      status: "fail",
      missingFields: expect.arrayContaining([
        "companyInfo.legalName",
        "beneficialOwners",
      ]),
    });
  });

  it("submits a valid workspace to the local CheckKYC contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "pass",
        checkedAt: "2026-04-21T02:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitCheckKycApplication(createValidWorkspace());

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/checkKYC",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result.response).toMatchObject({
      response: "Success",
      provider: "local-check-kyc-contract",
      transmissionMode: "local",
      endpoint: "http://127.0.0.1:8080/api/checkKYC",
      message: "CheckKYC payload was accepted by the CheckKycRequest API.",
      missingFields: [],
    });
  });

  it("uses the configured live CheckKYC endpoint when present", async () => {
    process.env.CHECK_KYC_API_URL = "https://kyc.example.com/applications";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "pass",
        applicationId: "EXT-12345",
        checkedAt: "2026-04-21T02:05:00.000Z",
        message: "External KYC accepted.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitCheckKycApplication(createValidWorkspace());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://kyc.example.com/applications",
      expect.any(Object),
    );
    expect(result.response).toMatchObject({
      response: "Success",
      provider: "external-check-kyc",
      transmissionMode: "live",
      endpoint: "https://kyc.example.com/applications",
      externalApplicationId: "EXT-12345",
      message: "External KYC accepted.",
    });
  });

  it("returns a failed transmission result without calling fetch when required fields are missing", async () => {
    process.env.CHECK_KYC_API_URL = "https://kyc.example.com/applications";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitCheckKycApplication(
      createValidWorkspace({
        primaryContact: {
          email: "",
        },
      }),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.response).toMatchObject({
      response: "Failed",
      provider: "external-check-kyc",
      transmissionMode: "live",
    });
    expect(result.response.missingFields).toContain("primaryContact.email");
  });

  it("throws an upstream error when the CheckKYC provider responds with a non-ok status", async () => {
    process.env.CHECK_KYC_API_URL = "https://kyc.example.com/applications";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => ({
        error: "Upstream KYC outage",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      submitCheckKycApplication(createValidWorkspace()),
    ).rejects.toMatchObject({
      message: "Upstream KYC outage",
      status: 502,
      payload: { error: "Upstream KYC outage" },
    });
  });

  it("falls back cleanly when the upstream response body is not valid JSON", async () => {
    process.env.CHECK_KYC_API_URL = "https://kyc.example.com/applications";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error("bad json");
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitCheckKycApplication(createValidWorkspace());

    expect(result.response).toMatchObject({
      response: "Success",
      provider: "external-check-kyc",
      message: "CheckKYC payload was accepted by the CheckKycRequest API.",
    });
  });
});
