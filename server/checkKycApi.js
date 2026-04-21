import { createHash } from "node:crypto";

const CHECK_KYC_PATH = "/api/checkKYC";
const DEFAULT_EXTERNAL_ENDPOINT = `http://127.0.0.1:${process.env.PORT ?? 8080}${CHECK_KYC_PATH}`;
const EXTERNAL_APPLICATION_TIMEOUT_MS = 4_000;

const REQUIRED_FIELD_PATHS = [
  "brandName",
  "formTitle",
  "companyInfo.legalName",
  "companyInfo.entityType",
  "companyInfo.registrationNumber",
  "companyInfo.taxId",
  "companyInfo.incorporationDate",
  "companyInfo.incorporationState",
  "companyInfo.incorporationCountry",
  "companyInfo.industry",
  "companyInfo.website",
  "companyInfo.annualRevenue",
  "companyInfo.employeeCount",
  "primaryContact.fullName",
  "primaryContact.title",
  "primaryContact.email",
  "primaryContact.phone",
  "addresses.registeredLine1",
  "addresses.city",
  "addresses.state",
  "addresses.postalCode",
  "addresses.country",
  "addresses.operatingCountry",
  "bankingProfile.accountPurpose",
  "bankingProfile.requestedProducts",
  "bankingProfile.expectedOpeningDeposit",
  "bankingProfile.monthlyIncoming",
  "bankingProfile.monthlyOutgoing",
  "bankingProfile.onlineBankingUsers",
];

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function getValueAtPath(value, path) {
  return path.split(".").reduce((currentValue, key) => currentValue?.[key], value);
}

function isMissingValue(value) {
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "string") {
    return !hasText(value);
  }

  return value === null || value === undefined;
}

function buildPayloadDigest(payload) {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
}

function normalizeOwners(owners = []) {
  return owners.map((owner) => ({
    id: String(owner.id ?? "").trim(),
    fullName: String(owner.fullName ?? "").trim(),
    title: String(owner.title ?? "").trim(),
    ownershipPercentage: String(owner.ownershipPercentage ?? "").trim(),
    email: String(owner.email ?? "").trim(),
    phone: digitsOnly(owner.phone),
    isAuthorizedSigner: Boolean(owner.isAuthorizedSigner),
  }));
}

export function createCheckKycPayload(workspace) {
  const addresses = workspace.addresses ?? {};
  const sameAsRegistered = Boolean(addresses.operatingSameAsRegistered);

  return {
    brandName: String(workspace.brandName ?? "").trim(),
    formTitle: String(workspace.formTitle ?? "").trim(),
    companyInfo: {
      legalName: String(workspace.companyInfo?.legalName ?? "").trim(),
      tradingName: String(workspace.companyInfo?.tradingName ?? "").trim(),
      entityType: String(workspace.companyInfo?.entityType ?? "").trim(),
      registrationNumber: String(workspace.companyInfo?.registrationNumber ?? "").trim(),
      taxId: String(workspace.companyInfo?.taxId ?? "").trim(),
      incorporationDate: String(workspace.companyInfo?.incorporationDate ?? "").trim(),
      incorporationState: String(workspace.companyInfo?.incorporationState ?? "").trim(),
      incorporationCountry: String(
        workspace.companyInfo?.incorporationCountry ?? "",
      ).trim(),
      industry: String(workspace.companyInfo?.industry ?? "").trim(),
      website: String(workspace.companyInfo?.website ?? "").trim(),
      annualRevenue: String(workspace.companyInfo?.annualRevenue ?? "").trim(),
      employeeCount: String(workspace.companyInfo?.employeeCount ?? "").trim(),
    },
    primaryContact: {
      fullName: String(workspace.primaryContact?.fullName ?? "").trim(),
      title: String(workspace.primaryContact?.title ?? "").trim(),
      email: String(workspace.primaryContact?.email ?? "").trim(),
      phone: digitsOnly(workspace.primaryContact?.phone),
      extension: String(workspace.primaryContact?.extension ?? "").trim(),
    },
    addresses: {
      registeredLine1: String(addresses.registeredLine1 ?? "").trim(),
      registeredLine2: String(addresses.registeredLine2 ?? "").trim(),
      city: String(addresses.city ?? "").trim(),
      state: String(addresses.state ?? "").trim(),
      postalCode: String(addresses.postalCode ?? "").trim(),
      country: String(addresses.country ?? "").trim(),
      operatingSameAsRegistered: sameAsRegistered,
      operatingLine1: sameAsRegistered
        ? String(addresses.registeredLine1 ?? "").trim()
        : String(addresses.operatingLine1 ?? "").trim(),
      operatingLine2: sameAsRegistered
        ? String(addresses.registeredLine2 ?? "").trim()
        : String(addresses.operatingLine2 ?? "").trim(),
      operatingCity: sameAsRegistered
        ? String(addresses.city ?? "").trim()
        : String(addresses.operatingCity ?? "").trim(),
      operatingState: sameAsRegistered
        ? String(addresses.state ?? "").trim()
        : String(addresses.operatingState ?? "").trim(),
      operatingPostalCode: sameAsRegistered
        ? String(addresses.postalCode ?? "").trim()
        : String(addresses.operatingPostalCode ?? "").trim(),
      operatingCountry: sameAsRegistered
        ? String(addresses.country ?? "").trim()
        : String(addresses.operatingCountry ?? "").trim(),
    },
    bankingProfile: {
      accountPurpose: String(workspace.bankingProfile?.accountPurpose ?? "").trim(),
      requestedProducts: Array.isArray(workspace.bankingProfile?.requestedProducts)
        ? workspace.bankingProfile.requestedProducts.map((product) =>
            String(product ?? "").trim(),
          )
        : [],
      expectedOpeningDeposit: String(
        workspace.bankingProfile?.expectedOpeningDeposit ?? "",
      ).trim(),
      monthlyIncoming: String(workspace.bankingProfile?.monthlyIncoming ?? "").trim(),
      monthlyOutgoing: String(workspace.bankingProfile?.monthlyOutgoing ?? "").trim(),
      onlineBankingUsers: String(
        workspace.bankingProfile?.onlineBankingUsers ?? "",
      ).trim(),
      internationalActivity: Boolean(
        workspace.bankingProfile?.internationalActivity,
      ),
      jurisdictionsInScope: String(
        workspace.bankingProfile?.jurisdictionsInScope ?? "",
      ).trim(),
      needsCommercialCards: Boolean(
        workspace.bankingProfile?.needsCommercialCards,
      ),
    },
    beneficialOwners: normalizeOwners(workspace.beneficialOwners),
    documents: {
      certificateOfFormation: Boolean(workspace.documents?.certificateOfFormation),
      taxIdLetter: Boolean(workspace.documents?.taxIdLetter),
      ownershipChart: Boolean(workspace.documents?.ownershipChart),
      boardResolution: Boolean(workspace.documents?.boardResolution),
      signerIdentification: Boolean(workspace.documents?.signerIdentification),
      addressProof: Boolean(workspace.documents?.addressProof),
    },
    declarations: {
      certifyAuthority: Boolean(workspace.declarations?.certifyAuthority),
      certifyBeneficialOwners: Boolean(
        workspace.declarations?.certifyBeneficialOwners,
      ),
      confirmTaxCompliance: Boolean(workspace.declarations?.confirmTaxCompliance),
      confirmTerms: Boolean(workspace.declarations?.confirmTerms),
    },
    additionalNotes: String(workspace.additionalNotes ?? "").trim(),
  };
}

export function collectMissingCheckKycFields(payload) {
  const missingFields = REQUIRED_FIELD_PATHS.filter((path) =>
    isMissingValue(getValueAtPath(payload, path)),
  );

  if (!Array.isArray(payload.beneficialOwners) || payload.beneficialOwners.length === 0) {
    missingFields.push("beneficialOwners");
    return missingFields;
  }

  payload.beneficialOwners.forEach((owner, index) => {
    [
      "id",
      "fullName",
      "title",
      "ownershipPercentage",
      "email",
      "phone",
    ].forEach((field) => {
      if (isMissingValue(owner?.[field])) {
        missingFields.push(`beneficialOwners[${index}].${field}`);
      }
    });
  });

  return [...new Set(missingFields)];
}

export async function processCheckKycRequest(payload) {
  const missingFields = collectMissingCheckKycFields(payload);
  const checkedAt = new Date().toISOString();

  if (missingFields.length) {
    return {
      status: "fail",
      message: `CheckKycRequest is missing required fields: ${missingFields.join(", ")}.`,
      checkedAt,
      missingFields,
    };
  }

  const shouldFail = String(payload.companyInfo?.legalName ?? "")
    .toLowerCase()
    .includes("fail");

  return {
    status: shouldFail ? "fail" : "pass",
    message: shouldFail
      ? `KYC screening failed for ${payload.companyInfo.legalName}.`
      : `KYC screening passed for ${payload.companyInfo.legalName}.`,
    checkedAt,
    missingFields,
  };
}

function mapCheckKycResponse({
  payload,
  endpoint,
  transmissionMode,
  provider,
  responseBody,
}) {
  const payloadDigest = buildPayloadDigest(payload);
  const status = String(responseBody?.status ?? "pass").toLowerCase();
  const missingFields = Array.isArray(responseBody?.missingFields)
    ? responseBody.missingFields
    : [];
  const failed = status === "fail" || missingFields.length > 0;

  return {
    request: payload,
    response: {
      response: failed ? "Failed" : "Success",
      provider,
      endpoint,
      externalApplicationId:
        responseBody?.externalApplicationId ??
        responseBody?.applicationId ??
        `KYC-${payloadDigest}`,
      receivedAt: responseBody?.checkedAt ?? new Date().toISOString(),
      transmissionMode,
      errorMessage: failed ? responseBody?.message ?? "KYC Failed." : null,
      message:
        responseBody?.message ??
        "CheckKYC payload was accepted by the CheckKycRequest API.",
      missingFields,
      raw: responseBody,
    },
  };
}

export async function submitCheckKycApplication(workspace) {
  const payload = createCheckKycPayload(workspace);
  const missingFields = collectMissingCheckKycFields(payload);
  const endpoint = hasText(process.env.CHECK_KYC_API_URL)
    ? process.env.CHECK_KYC_API_URL
    : DEFAULT_EXTERNAL_ENDPOINT;

  if (missingFields.length) {
    return mapCheckKycResponse({
      payload,
      endpoint,
      transmissionMode: hasText(process.env.CHECK_KYC_API_URL) ? "live" : "local",
      provider: hasText(process.env.CHECK_KYC_API_URL)
        ? "external-check-kyc"
        : "local-check-kyc-contract",
      responseBody: {
        status: "fail",
        message: `CheckKycRequest is missing required fields: ${missingFields.join(", ")}.`,
        checkedAt: new Date().toISOString(),
        missingFields,
      },
    });
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

    return mapCheckKycResponse({
      payload,
      endpoint,
      transmissionMode: hasText(process.env.CHECK_KYC_API_URL) ? "live" : "local",
      provider: hasText(process.env.CHECK_KYC_API_URL)
        ? "external-check-kyc"
        : "local-check-kyc-contract",
      responseBody,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
