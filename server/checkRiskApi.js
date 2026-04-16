import { createHash } from "node:crypto";

const DEFAULT_EXTERNAL_ENDPOINT = "https://external.example.com/check-risk";
const EXTERNAL_APPLICATION_TIMEOUT_MS = 4_000;

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function parseInteger(value) {
  const normalized = digitsOnly(value);
  return normalized ? Number.parseInt(normalized, 10) : 0;
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

export function createCheckRiskPayload(workspace) {
  return {
    sourceSystem: "commercial-account-opening-app",
    submittedAt: new Date().toISOString(),
    applicant: {
      legalName: workspace.companyInfo.legalName,
      entityType: workspace.companyInfo.entityType,
      registrationNumber: workspace.companyInfo.registrationNumber,
      taxId: workspace.companyInfo.taxId,
      incorporationCountry: workspace.companyInfo.incorporationCountry,
      industry: workspace.companyInfo.industry,
      annualRevenue: workspace.companyInfo.annualRevenue,
      employeeCount: workspace.companyInfo.employeeCount,
    },
    primaryContact: {
      fullName: workspace.primaryContact.fullName,
      email: workspace.primaryContact.email,
      phone: digitsOnly(workspace.primaryContact.phone),
    },
    bankingProfile: {
      accountPurpose: workspace.bankingProfile.accountPurpose,
      requestedProducts: workspace.bankingProfile.requestedProducts,
      expectedOpeningDeposit: workspace.bankingProfile.expectedOpeningDeposit,
      monthlyIncoming: workspace.bankingProfile.monthlyIncoming,
      monthlyOutgoing: workspace.bankingProfile.monthlyOutgoing,
      internationalActivity: workspace.bankingProfile.internationalActivity,
      jurisdictionsInScope: workspace.bankingProfile.jurisdictionsInScope,
      needsCommercialCards: workspace.bankingProfile.needsCommercialCards,
    },
    beneficialOwners: normalizeOwners(workspace.beneficialOwners),
    documents: mapDocuments(workspace),
  };
}

function deriveSimulatedRiskResponse(payload) {
  let score = 18;

  if (payload.bankingProfile.internationalActivity) {
    score += 18;
  }
  if (String(payload.applicant.incorporationCountry ?? "") !== "United States") {
    score += 12;
  }
  if (
    parseInteger(payload.bankingProfile.monthlyIncoming) +
      parseInteger(payload.bankingProfile.monthlyOutgoing) >=
    2_000_000
  ) {
    score += 14;
  }
  if ((payload.beneficialOwners ?? []).length > 3) {
    score += 8;
  }
  if ((payload.documents ?? []).filter((document) => document.ready).length < 4) {
    score += 10;
  }

  score = Math.min(score, 100);

  let response = "Low";
  if (score >= 55) {
    response = "High";
  } else if (score >= 30) {
    response = "Moderate";
  }

  return {
    response,
    riskScore: score,
    recommendation:
      response === "High"
        ? "Manual review is required before account opening can proceed."
        : response === "Moderate"
          ? "Analyst follow-up is recommended before advancing the application."
          : "Application can move to the next review stage.",
    message:
      response === "High"
        ? "checkRisk identified a high-risk profile."
        : response === "Moderate"
          ? "checkRisk identified a moderate-risk profile."
          : "checkRisk identified a low-risk profile.",
  };
}

function createSimulatedCheckRiskResponse(payload, endpoint) {
  const payloadDigest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  const derivedRisk = deriveSimulatedRiskResponse(payload);

  return {
    ...derivedRisk,
    provider: "simulated-check-risk",
    endpoint,
    externalAssessmentId: `RISK-${payloadDigest}`,
    receivedAt: new Date().toISOString(),
    transmissionMode: "simulated",
  };
}

export async function submitCheckRiskApplication(workspace) {
  const payload = createCheckRiskPayload(workspace);
  const endpoint = process.env.CHECK_RISK_API_URL ?? DEFAULT_EXTERNAL_ENDPOINT;

  if (!hasText(process.env.CHECK_RISK_API_URL)) {
    return {
      request: payload,
      response: createSimulatedCheckRiskResponse(payload, endpoint),
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
        responseBody?.error ?? `checkRisk request failed with status ${response.status}.`,
      );
      error.status = response.status;
      error.payload = responseBody;
      throw error;
    }

    return {
      request: payload,
      response: {
        response: responseBody?.response ?? "Low",
        riskScore: responseBody?.riskScore ?? null,
        recommendation: responseBody?.recommendation ?? null,
        message:
          responseBody?.message ??
          "checkRisk payload was accepted by the external application.",
        provider: "external-check-risk",
        endpoint,
        externalAssessmentId:
          responseBody?.externalAssessmentId ??
          responseBody?.assessmentId ??
          null,
        receivedAt: responseBody?.receivedAt ?? new Date().toISOString(),
        transmissionMode: "live",
        raw: responseBody,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
