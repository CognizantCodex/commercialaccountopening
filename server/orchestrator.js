import { runKycAgent } from "./agents/kycAgent.js";
import { runRiskAgent } from "./agents/riskAgent.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EIN_PATTERN = /^\d{2}-?\d{7}$/;
const PHONE_PATTERN = /^\d{10}$/;
const ZIP_PATTERN = /^\d{5}$/;
const REQUIRED_DECLARATIONS = [
  "certifyAuthority",
  "certifyBeneficialOwners",
  "confirmTaxCompliance",
  "confirmTerms",
];

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

function parseDecimal(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readyDocumentCount(workspace) {
  return Object.values(workspace.documents ?? {}).filter(Boolean).length;
}

function createCheck({ key, label, decision, summary, flags = [], score = null }) {
  return {
    key,
    label,
    status: "completed",
    decision,
    summary,
    flags,
    score,
  };
}

function collectSubmissionIssues(workspace) {
  const issues = [];

  const pushIssue = (fieldKey, message) => {
    issues.push({ fieldKey, message });
  };

  if (!hasText(workspace.companyInfo?.legalName)) {
    pushIssue("companyInfo.legalName", "Legal entity name is required.");
  }
  if (!hasText(workspace.companyInfo?.registrationNumber)) {
    pushIssue("companyInfo.registrationNumber", "Registration number is required.");
  }
  if (!EIN_PATTERN.test(String(workspace.companyInfo?.taxId ?? "").trim())) {
    pushIssue("companyInfo.taxId", "Federal tax ID / EIN must be valid.");
  }
  if (!hasText(workspace.companyInfo?.incorporationDate)) {
    pushIssue("companyInfo.incorporationDate", "Date of incorporation is required.");
  }
  if (!hasText(workspace.companyInfo?.incorporationState)) {
    pushIssue("companyInfo.incorporationState", "State of registration is required.");
  }
  if (!hasText(workspace.companyInfo?.industry)) {
    pushIssue("companyInfo.industry", "Primary industry is required.");
  }

  if (!hasText(workspace.primaryContact?.fullName)) {
    pushIssue("primaryContact.fullName", "Primary contact name is required.");
  }
  if (!EMAIL_PATTERN.test(String(workspace.primaryContact?.email ?? "").trim())) {
    pushIssue("primaryContact.email", "Primary contact email must be valid.");
  }
  if (!PHONE_PATTERN.test(digitsOnly(workspace.primaryContact?.phone))) {
    pushIssue("primaryContact.phone", "Primary contact phone must be 10 digits.");
  }

  if (!hasText(workspace.addresses?.registeredLine1)) {
    pushIssue("addresses.registeredLine1", "Registered address line 1 is required.");
  }
  if (!hasText(workspace.addresses?.city)) {
    pushIssue("addresses.city", "Registered city is required.");
  }
  if (!hasText(workspace.addresses?.state)) {
    pushIssue("addresses.state", "Registered state is required.");
  }
  if (!ZIP_PATTERN.test(digitsOnly(workspace.addresses?.postalCode))) {
    pushIssue("addresses.postalCode", "Registered ZIP code must be 5 digits.");
  }

  if (!workspace.addresses?.operatingSameAsRegistered) {
    if (!hasText(workspace.addresses?.operatingLine1)) {
      pushIssue("addresses.operatingLine1", "Operating address line 1 is required.");
    }
    if (!hasText(workspace.addresses?.operatingCity)) {
      pushIssue("addresses.operatingCity", "Operating city is required.");
    }
    if (!hasText(workspace.addresses?.operatingState)) {
      pushIssue("addresses.operatingState", "Operating state is required.");
    }
    if (!ZIP_PATTERN.test(digitsOnly(workspace.addresses?.operatingPostalCode))) {
      pushIssue(
        "addresses.operatingPostalCode",
        "Operating ZIP code must be 5 digits.",
      );
    }
  }

  if (!hasText(workspace.bankingProfile?.accountPurpose)) {
    pushIssue("bankingProfile.accountPurpose", "Account purpose is required.");
  }
  if (!(workspace.bankingProfile?.requestedProducts?.length > 0)) {
    pushIssue(
      "bankingProfile.requestedProducts",
      "At least one requested product is required.",
    );
  }
  if (parseInteger(workspace.bankingProfile?.expectedOpeningDeposit) <= 0) {
    pushIssue(
      "bankingProfile.expectedOpeningDeposit",
      "Expected opening deposit must be greater than 0.",
    );
  }
  if (parseInteger(workspace.bankingProfile?.monthlyIncoming) <= 0) {
    pushIssue(
      "bankingProfile.monthlyIncoming",
      "Estimated monthly incoming volume must be greater than 0.",
    );
  }
  if (parseInteger(workspace.bankingProfile?.monthlyOutgoing) <= 0) {
    pushIssue(
      "bankingProfile.monthlyOutgoing",
      "Estimated monthly outgoing volume must be greater than 0.",
    );
  }

  const owners = workspace.beneficialOwners ?? [];
  if (!owners.length) {
    pushIssue(
      "beneficialOwners",
      "At least one beneficial owner or control person is required.",
    );
  }

  owners.forEach((owner) => {
    const prefix = `beneficialOwners.${owner.id}`;
    if (!hasText(owner.fullName)) {
      pushIssue(`${prefix}.fullName`, "Owner full name is required.");
    }
    if (!hasText(owner.title)) {
      pushIssue(`${prefix}.title`, "Owner title is required.");
    }

    const ownershipPercentage = parseDecimal(owner.ownershipPercentage);
    if (!(ownershipPercentage > 0 && ownershipPercentage <= 100)) {
      pushIssue(
        `${prefix}.ownershipPercentage`,
        "Owner ownership percentage must be between 0 and 100.",
      );
    }

    const ownerEmail = String(owner.email ?? "").trim();
    if (ownerEmail && !EMAIL_PATTERN.test(ownerEmail)) {
      pushIssue(`${prefix}.email`, "Owner email must be valid.");
    }

    const ownerPhoneDigits = digitsOnly(owner.phone);
    if (ownerPhoneDigits && !PHONE_PATTERN.test(ownerPhoneDigits)) {
      pushIssue(`${prefix}.phone`, "Owner phone must be 10 digits.");
    }
  });

  if (!owners.some((owner) => owner.isAuthorizedSigner)) {
    pushIssue(
      "beneficialOwners",
      "At least one beneficial owner or control person must be an authorized signer.",
    );
  }

  if (readyDocumentCount(workspace) < 3) {
    pushIssue(
      "documents",
      "Mark at least three supporting documents as ready before submission.",
    );
  }

  REQUIRED_DECLARATIONS.forEach((key) => {
    if (!workspace.declarations?.[key]) {
      pushIssue(`declarations.${key}`, "All required declarations must be accepted.");
    }
  });

  return issues;
}

async function runAmlReview(workspace) {
  const flags = [];
  const monthlyVolume =
    parseInteger(workspace.bankingProfile?.monthlyIncoming) +
    parseInteger(workspace.bankingProfile?.monthlyOutgoing);
  const industry = String(workspace.companyInfo?.industry ?? "").toLowerCase();

  if (workspace.bankingProfile?.internationalActivity) {
    flags.push("International transaction activity is expected.");
  }
  if (hasText(workspace.bankingProfile?.jurisdictionsInScope)) {
    flags.push("Foreign jurisdictions were listed for transaction activity.");
  }
  if (monthlyVolume >= 5_000_000) {
    flags.push("Projected monthly transaction volume is elevated.");
  }
  if (industry.includes("real estate") || industry.includes("transportation")) {
    flags.push("Industry profile requires enhanced AML monitoring.");
  }

  let decision = "clear";
  if (flags.length >= 3) {
    decision = "escalate";
  } else if (flags.length > 0) {
    decision = "review";
  }

  const summary =
    decision === "clear"
      ? "AML review completed with no enhanced monitoring triggers."
      : decision === "review"
        ? "AML review completed with standard monitoring escalation flags."
        : "AML review completed with enhanced due diligence required.";

  return createCheck({
    key: "aml",
    label: "AML",
    decision,
    summary,
    flags,
  });
}

async function runDocumentProcessingReview(workspace) {
  const readyDocuments = readyDocumentCount(workspace);
  const missingDocuments = (workspace.documentOptions ?? [])
    .filter((document) => !workspace.documents?.[document.key])
    .map((document) => document.title);

  let decision = "complete";
  if (readyDocuments < 4) {
    decision = "follow_up_required";
  } else if (readyDocuments < (workspace.documentOptions ?? []).length) {
    decision = "review";
  }

  const flags =
    decision === "complete"
      ? []
      : missingDocuments.slice(0, 3).map(
          (documentTitle) => `${documentTitle} still needs to be provided or confirmed.`,
        );

  const summary =
    decision === "complete"
      ? "Document processing review completed with a sufficiently complete package."
      : "Document processing review identified missing or pending support documents.";

  return createCheck({
    key: "documentProcessing",
    label: "Document processing",
    decision,
    summary,
    flags,
  });
}

function deriveOverallDecision(checks) {
  const amlDecision = checks.aml.decision;
  const documentDecision = checks.documentProcessing.decision;
  const riskDecision = checks.risk.decision;
  const kycDecision = checks.kyc.decision;

  if (
    amlDecision === "escalate" ||
    documentDecision === "follow_up_required" ||
    riskDecision === "high"
  ) {
    return "manual_review";
  }

  if (
    amlDecision === "review" ||
    documentDecision === "review" ||
    riskDecision === "moderate" ||
    kycDecision === "review"
  ) {
    return "enhanced_review";
  }

  return "ready_for_bank_review";
}

function deriveSubmissionSummary(overallDecision) {
  switch (overallDecision) {
    case "manual_review":
      return "Submission received. Automated checks completed and routed the application to manual review.";
    case "enhanced_review":
      return "Submission received. Automated checks completed with follow-up review recommended.";
    default:
      return "Submission received. Automated checks completed and the application is ready for bank review.";
  }
}

function deriveRecommendedAction(overallDecision) {
  switch (overallDecision) {
    case "manual_review":
      return "Route the application to an onboarding specialist for enhanced due diligence.";
    case "enhanced_review":
      return "Queue the application for analyst follow-up on flagged review items.";
    default:
      return "Advance the application to the bank review queue.";
  }
}

export async function orchestrateApplicationSubmission(workspace) {
  const startedAt = new Date().toISOString();
  const submissionId = `SUB-${startedAt.replace(/\D/g, "").slice(0, 17)}`;
  const [kyc, aml, documentProcessing, risk] = await Promise.all([
    runKycAgent(workspace),
    runAmlReview(workspace),
    runDocumentProcessingReview(workspace),
    runRiskAgent(workspace),
  ]);
  const completedAt = new Date().toISOString();
  const checks = {
    kyc,
    aml,
    documentProcessing,
    risk,
  };
  const overallDecision = deriveOverallDecision(checks);

  return {
    submission: {
      status: "submitted",
      referenceId: submissionId,
      submittedAt: startedAt,
      overallDecision,
      summary: deriveSubmissionSummary(overallDecision),
      recommendedAction: deriveRecommendedAction(overallDecision),
    },
    orchestration: {
      status: "completed",
      startedAt,
      completedAt,
      summary:
        "The orchestrator completed KYC, AML, document processing, and risk review.",
      checks,
      integrations: {
        checkKyc: kyc.integration?.checkKyc ?? null,
        checkRisk: risk.integration?.checkRisk ?? null,
      },
    },
  };
}

export { collectSubmissionIssues };
