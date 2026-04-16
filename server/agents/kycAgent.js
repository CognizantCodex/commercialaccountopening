import { submitCheckKycApplication } from "../checkKycApi.js";

function hasText(value) {
  return String(value ?? "").trim().length > 0;
}

function createCheck({
  key,
  label,
  decision,
  summary,
  flags = [],
  integration = null,
}) {
  return {
    key,
    label,
    status: "completed",
    decision,
    summary,
    flags,
    score: null,
    integration,
  };
}

export class KycFailedError extends Error {
  constructor(message, integration = null) {
    super(message);
    this.name = "KycFailedError";
    this.integration = integration;
  }
}

export async function runKycAgent(workspace) {
  const flags = [];

  if (String(workspace.companyInfo?.incorporationCountry ?? "") !== "United States") {
    flags.push("Foreign registration requires enhanced identity verification.");
  }
  if (!hasText(workspace.companyInfo?.website)) {
    flags.push("Corporate website was not provided.");
  }
  if ((workspace.beneficialOwners ?? []).length > 3) {
    flags.push("Ownership structure includes more than three control persons.");
  }

  const checkKycTransmission = await submitCheckKycApplication(workspace);

  if (checkKycTransmission.response.transmissionMode === "simulated") {
    flags.push(
      "CheckKYC API is running in simulated mode until an external endpoint is configured.",
    );
  }

  const integration = {
    checkKyc: {
      response: checkKycTransmission.response.response,
      endpoint: checkKycTransmission.response.endpoint,
      provider: checkKycTransmission.response.provider,
      transmissionMode: checkKycTransmission.response.transmissionMode,
      externalApplicationId: checkKycTransmission.response.externalApplicationId,
      receivedAt: checkKycTransmission.response.receivedAt,
      errorMessage: checkKycTransmission.response.errorMessage,
      message: checkKycTransmission.response.message,
    },
  };

  if (checkKycTransmission.response.response === "Failed") {
    throw new KycFailedError(
      checkKycTransmission.response.errorMessage ?? "KYC Failed.",
      integration,
    );
  }

  const decision = flags.length ? "review" : "clear";
  const summary = flags.length
    ? "KYC agent completed identity review and submitted the application to CheckKYC with follow-up items."
    : "KYC agent completed identity review and submitted the application to CheckKYC successfully.";

  return createCheck({
    key: "kyc",
    label: "KYC",
    decision,
    summary,
    flags,
    integration,
  });
}
