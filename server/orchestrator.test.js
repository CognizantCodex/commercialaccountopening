import { beforeEach, describe, expect, it, vi } from "vitest";
import { createValidWorkspace } from "./testUtils.js";
import { defaultWorkspace } from "../src/defaultWorkspace.js";

const runKycAgent = vi.fn();
const runRiskAgent = vi.fn();

vi.mock("./agents/kycAgent.js", () => ({
  runKycAgent,
}));

vi.mock("./agents/riskAgent.js", () => ({
  runRiskAgent,
}));

const { collectSubmissionIssues, orchestrateApplicationSubmission } = await import(
  "./orchestrator.js"
);

describe("orchestrator", () => {
  beforeEach(() => {
    runKycAgent.mockReset();
    runRiskAgent.mockReset();
  });

  it("returns no submission issues for a valid workspace", () => {
    expect(collectSubmissionIssues(createValidWorkspace())).toEqual([]);
  });

  it("collects field-level issues for incomplete workspaces", () => {
    const issues = collectSubmissionIssues(
      createValidWorkspace({
        companyInfo: {
          legalName: "",
          taxId: "12",
        },
        addresses: {
          operatingSameAsRegistered: false,
          operatingLine1: "",
          operatingCity: "",
          operatingState: "",
          operatingPostalCode: "",
          operatingCountry: "",
        },
        beneficialOwners: [
          {
            id: "owner-1",
            fullName: "",
            title: "",
            ownershipPercentage: "0",
            email: "bad-email",
            phone: "123",
            isAuthorizedSigner: false,
          },
        ],
        declarations: {
          confirmTerms: false,
        },
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: "companyInfo.legalName" }),
        expect.objectContaining({ fieldKey: "companyInfo.taxId" }),
        expect.objectContaining({ fieldKey: "addresses.operatingLine1" }),
        expect.objectContaining({ fieldKey: "beneficialOwners.owner-1.fullName" }),
        expect.objectContaining({ fieldKey: "beneficialOwners.owner-1.email" }),
        expect.objectContaining({ fieldKey: "declarations.confirmTerms" }),
      ]),
    );
  });

  it("collects the broad set of required-field issues for a sparse workspace", () => {
    const issues = collectSubmissionIssues({
      ...structuredClone(defaultWorkspace),
      beneficialOwners: [],
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: "companyInfo.legalName" }),
        expect.objectContaining({ fieldKey: "companyInfo.entityType" }),
        expect.objectContaining({ fieldKey: "primaryContact.email" }),
        expect.objectContaining({ fieldKey: "addresses.postalCode" }),
        expect.objectContaining({ fieldKey: "bankingProfile.requestedProducts" }),
        expect.objectContaining({ fieldKey: "beneficialOwners" }),
        expect.objectContaining({ fieldKey: "documents" }),
        expect.objectContaining({ fieldKey: "declarations.certifyAuthority" }),
      ]),
    );
  });

  it("collects owner required-contact issues when owner contact data is blank", () => {
    const issues = collectSubmissionIssues(
      createValidWorkspace({
        beneficialOwners: [
          {
            id: "owner-1",
            fullName: "Jordan Lee",
            title: "Managing Member",
            ownershipPercentage: "65",
            email: "",
            phone: "",
            isAuthorizedSigner: true,
          },
        ],
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: "beneficialOwners.owner-1.email" }),
        expect.objectContaining({ fieldKey: "beneficialOwners.owner-1.phone" }),
      ]),
    );
  });

  it("derives manual review when the risk agent returns high risk", async () => {
    runKycAgent.mockResolvedValue({
      key: "kyc",
      label: "KYC",
      status: "completed",
      decision: "clear",
      summary: "KYC complete.",
      flags: [],
      score: null,
      integration: {
        checkKyc: {
          response: "Success",
          externalApplicationId: "KYC-123",
        },
      },
    });

    runRiskAgent.mockResolvedValue({
      key: "risk",
      label: "Risk",
      status: "completed",
      decision: "high",
      summary: "Risk agent completed review and identified a high-risk profile.",
      flags: [],
      score: null,
      integration: {
        checkRisk: {
          risk: "High",
        },
      },
    });

    const result = await orchestrateApplicationSubmission(createValidWorkspace());

    expect(result.submission.status).toBe("submitted");
    expect(result.submission.referenceId).toMatch(/^SUB-/);
    expect(result.submission.overallDecision).toBe("manual_review");
    expect(result.submission.recommendedAction).toContain("enhanced due diligence");
    expect(result.orchestration.checks.kyc.decision).toBe("clear");
    expect(result.orchestration.checks.risk.decision).toBe("high");
    expect(result.orchestration.integrations).toEqual({
      checkKyc: {
        response: "Success",
        externalApplicationId: "KYC-123",
      },
      checkRisk: {
        risk: "High",
      },
    });
  });

  it("derives enhanced review when AML and document checks raise standard review flags", async () => {
    runKycAgent.mockResolvedValue({
      key: "kyc",
      label: "KYC",
      status: "completed",
      decision: "review",
      summary: "KYC completed with follow-up items.",
      flags: ["Foreign registration requires enhanced identity verification."],
      score: null,
      integration: {
        checkKyc: {
          response: "Success",
        },
      },
    });

    runRiskAgent.mockResolvedValue({
      key: "risk",
      label: "Risk",
      status: "completed",
      decision: "moderate",
      summary: "Risk agent completed review and identified a moderate-risk profile.",
      flags: [],
      score: null,
      integration: {
        checkRisk: {
          risk: "Moderate",
        },
      },
    });

    const result = await orchestrateApplicationSubmission(
      createValidWorkspace({
        companyInfo: {
          industry: "Technology services",
        },
        bankingProfile: {
          internationalActivity: true,
          jurisdictionsInScope: "",
        },
        documents: {
          addressProof: false,
          signerIdentification: true,
        },
      }),
    );

    expect(result.submission.overallDecision).toBe("enhanced_review");
    expect(result.submission.summary).toContain("follow-up review recommended");
    expect(result.submission.recommendedAction).toContain("analyst follow-up");
    expect(result.orchestration.checks.aml.decision).toBe("review");
    expect(result.orchestration.checks.documentProcessing.decision).toBe("review");
    expect(result.orchestration.checks.risk.decision).toBe("moderate");
    expect(result.orchestration.checks.kyc.decision).toBe("review");
  });

  it("derives ready for bank review when all checks are clear or complete", async () => {
    runKycAgent.mockResolvedValue({
      key: "kyc",
      label: "KYC",
      status: "completed",
      decision: "clear",
      summary: "KYC complete.",
      flags: [],
      score: null,
      integration: {
        checkKyc: {
          response: "Success",
        },
      },
    });

    runRiskAgent.mockResolvedValue({
      key: "risk",
      label: "Risk",
      status: "completed",
      decision: "low",
      summary: "Risk agent completed review and identified a low-risk profile.",
      flags: [],
      score: null,
      integration: {
        checkRisk: {
          risk: "Low",
        },
      },
    });

    const result = await orchestrateApplicationSubmission(
      createValidWorkspace({
        documents: {
          certificateOfFormation: true,
          taxIdLetter: true,
          ownershipChart: true,
          boardResolution: true,
          signerIdentification: true,
          addressProof: true,
        },
      }),
    );

    expect(result.submission.overallDecision).toBe("ready_for_bank_review");
    expect(result.submission.summary).toContain("ready for bank review");
    expect(result.submission.recommendedAction).toBe(
      "Advance the application to the bank review queue.",
    );
    expect(result.orchestration.checks.aml.decision).toBe("clear");
    expect(result.orchestration.checks.documentProcessing.decision).toBe("complete");
    expect(result.orchestration.checks.risk.decision).toBe("low");
  });
});
