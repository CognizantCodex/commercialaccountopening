import { createHash } from "node:crypto";

const DEFAULT_EXTERNAL_ENDPOINT = "https://external.example.com/check-kyc";
const EXTERNAL_APPLICATION_TIMEOUT_MS = 4_000;

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function normalizeOwners(owners = []) {
  return owners.map((owner) => ({
    id: owner.id,
    fullName: owner.fullName,
    title: owner.title,
    ownershipPercentage: owner.ownershipPercentage,
    email: owner.email,
    phone: digitsOnly(owner.phone),
    isAuthorizedSigner: owner.isAuthorizedSigner,
  }));
}

function mapDocuments(workspace) {
  return (workspace.documentOptions ?? []).map((document) => ({
    key: document.key,
    title: document.title,
    detail: document.detail,
    ready: Boolean(workspace.documents?.[document.key]),
  }));
}

function mapDeclarations(workspace) {
  return (workspace.declarationOptions ?? []).map((declaration) => ({
    key: declaration.key,
    title: declaration.title,
    accepted: Boolean(workspace.declarations?.[declaration.key]),
    required: Boolean(declaration.required),
  }));
}

export function createCheckKycPayload(workspace) {
  return {
    sourceSystem: "commercial-account-opening-app",
    submittedAt: new Date().toISOString(),
    applicant: {
      legalName: workspace.companyInfo.legalName,
      tradingName: workspace.companyInfo.tradingName,
      entityType: workspace.companyInfo.entityType,
      registrationNumber: workspace.companyInfo.registrationNumber,
      taxId: workspace.companyInfo.taxId,
      incorporationDate: workspace.companyInfo.incorporationDate,
      incorporationState: workspace.companyInfo.incorporationState,
      incorporationCountry: workspace.companyInfo.incorporationCountry,
      industry: workspace.companyInfo.industry,
      website: workspace.companyInfo.website,
      annualRevenue: workspace.companyInfo.annualRevenue,
      employeeCount: workspace.companyInfo.employeeCount,
    },
    primaryContact: {
      fullName: workspace.primaryContact.fullName,
      title: workspace.primaryContact.title,
      email: workspace.primaryContact.email,
      phone: digitsOnly(workspace.primaryContact.phone),
      extension: workspace.primaryContact.extension,
    },
    addresses: {
      registered: {
        line1: workspace.addresses.registeredLine1,
        line2: workspace.addresses.registeredLine2,
        city: workspace.addresses.city,
        state: workspace.addresses.state,
        postalCode: workspace.addresses.postalCode,
        country: workspace.addresses.country,
      },
      operating: workspace.addresses.operatingSameAsRegistered
        ? { sameAsRegistered: true }
        : {
            sameAsRegistered: false,
            line1: workspace.addresses.operatingLine1,
            line2: workspace.addresses.operatingLine2,
            city: workspace.addresses.operatingCity,
            state: workspace.addresses.operatingState,
            postalCode: workspace.addresses.operatingPostalCode,
            country: workspace.addresses.operatingCountry,
          },
    },
    bankingProfile: {
      accountPurpose: workspace.bankingProfile.accountPurpose,
      requestedProducts: workspace.bankingProfile.requestedProducts,
      expectedOpeningDeposit: workspace.bankingProfile.expectedOpeningDeposit,
      monthlyIncoming: workspace.bankingProfile.monthlyIncoming,
      monthlyOutgoing: workspace.bankingProfile.monthlyOutgoing,
      onlineBankingUsers: workspace.bankingProfile.onlineBankingUsers,
      internationalActivity: workspace.bankingProfile.internationalActivity,
      jurisdictionsInScope: workspace.bankingProfile.jurisdictionsInScope,
      needsCommercialCards: workspace.bankingProfile.needsCommercialCards,
    },
    beneficialOwners: normalizeOwners(workspace.beneficialOwners),
    documents: mapDocuments(workspace),
    declarations: mapDeclarations(workspace),
    additionalNotes: workspace.additionalNotes,
  };
}

function createSimulatedCheckKycResponse(payload, endpoint) {
  const payloadDigest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  const shouldFail = String(payload.applicant?.legalName ?? "")
    .toLowerCase()
    .includes("fail");

  return {
    response: shouldFail ? "Failed" : "Success",
    provider: "simulated-check-kyc",
    endpoint,
    externalApplicationId: `KYC-${payloadDigest}`,
    receivedAt: new Date().toISOString(),
    transmissionMode: "simulated",
    errorMessage: shouldFail
      ? "KYC Failed: the external KYC application rejected the submitted business profile."
      : null,
    message: shouldFail
      ? "CheckKYC simulated a failed KYC decision."
      : "CheckKYC payload was prepared successfully. Configure CHECK_KYC_API_URL to forward it to an external application.",
  };
}

export async function submitCheckKycApplication(workspace) {
  const payload = createCheckKycPayload(workspace);
  const endpoint = process.env.CHECK_KYC_API_URL ?? DEFAULT_EXTERNAL_ENDPOINT;

  if (!hasText(process.env.CHECK_KYC_API_URL)) {
    return {
      request: payload,
      response: createSimulatedCheckKycResponse(payload, endpoint),
    };
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, EXTERNAL_APPLICATION_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: abortController.signal,
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(
        responseBody?.error ?? `CheckKYC request failed with status ${response.status}.`,
      );
      error.status = response.status;
      error.payload = responseBody;
      throw error;
    }

    return {
      request: payload,
      response: {
        response: responseBody?.response ?? "Success",
        provider: "external-check-kyc",
        endpoint,
        externalApplicationId:
          responseBody?.externalApplicationId ??
          responseBody?.applicationId ??
          null,
        receivedAt: responseBody?.receivedAt ?? new Date().toISOString(),
        transmissionMode: "live",
        errorMessage: responseBody?.errorMessage ?? null,
        message:
          responseBody?.message ??
          "CheckKYC payload was accepted by the external application.",
        raw: responseBody,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
