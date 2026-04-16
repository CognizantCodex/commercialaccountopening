const crypto = require("node:crypto");
const { writeAuditEntry, auditDirectory } = require("./utils/auditLogger");

const HIGH_RISK_TERMS = [
  "layering",
  "structuring",
  "smurfing",
  "sanctioned",
  "shell company",
  "fraud",
  "mule",
  "terrorist financing",
  "high-risk jurisdiction",
  "rapid movement",
  "burst velocity",
  "abrupt geographical shift",
];

const MEDIUM_RISK_TERMS = [
  "velocity change",
  "geographical shift",
  "multiple counterparties",
  "unusual corridor",
  "cash intensive",
  "adverse media",
  "pep",
  "manual review",
];

function anonymizePii(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b\d{10,16}\b/g, "[REDACTED_NUMBER]");
}

function sanitizeObject(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sanitizeObject(nestedValue)]),
    );
  }

  return anonymizePii(value);
}

function normalizeText(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function toConfidence(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildAuditRecorder(command, referenceId) {
  const steps = [];

  function record(action, why, evidence) {
    const entry = {
      timestamp: new Date().toISOString(),
      command,
      referenceId,
      action,
      why,
      evidence: sanitizeObject(evidence),
    };

    const filePath = writeAuditEntry(entry);
    steps.push({
      action,
      why,
      evidence: sanitizeObject(evidence),
      auditPath: filePath,
    });
  }

  return { steps, record };
}

function analyzeMonitoring(transaction = {}) {
  const notes = [
    transaction.description,
    transaction.patternSummary,
    ...(Array.isArray(transaction.flags) ? transaction.flags : []),
    ...(Array.isArray(transaction.monitoringNotes) ? transaction.monitoringNotes : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const hits = [];
  let score = 18;

  for (const term of HIGH_RISK_TERMS) {
    if (notes.includes(term)) {
      hits.push(`High-risk signal detected: ${term}`);
      score += 17;
    }
  }

  for (const term of MEDIUM_RISK_TERMS) {
    if (notes.includes(term)) {
      hits.push(`Elevated signal detected: ${term}`);
      score += 9;
    }
  }

  if (transaction.geoShift === true) {
    hits.push("Abrupt geographical shift present in transaction metadata");
    score += 15;
  }

  if (transaction.velocitySpike === true) {
    hits.push("Velocity spike present in transaction metadata");
    score += 12;
  }

  if (transaction.layeringIndicator === true) {
    hits.push("Layering indicator present in transaction metadata");
    score += 20;
  }

  const alertGenerated = hits.length > 0 || score >= 45;

  return {
    alertGenerated,
    score: toConfidence(score),
    triggers: hits.length > 0 ? hits : ["No high-risk transaction anomaly was explicitly provided."],
  };
}

function determineRiskLevel(monitoring, kycData = {}, adverseMedia = {}) {
  const adverseTerms = normalizeText(adverseMedia.summary || adverseMedia.headline || adverseMedia.result);
  const kycTerms = normalizeText(kycData.summary || kycData.riskNotes || "");

  let score = monitoring.score;
  const reasons = [...monitoring.triggers];

  if (adverseTerms.includes("sanction") || adverseTerms.includes("fraud") || adverseTerms.includes("money laundering")) {
    score += 22;
    reasons.push("Adverse media contains severe negative AML signal");
  } else if (adverseTerms.includes("investigation") || adverseTerms.includes("negative")) {
    score += 10;
    reasons.push("Adverse media contains elevated negative signal");
  }

  if (kycTerms.includes("high risk") || kycTerms.includes("pep") || kycTerms.includes("enhanced due diligence")) {
    score += 12;
    reasons.push("KYC data indicates elevated AML risk posture");
  }

  score = toConfidence(score);

  if (score >= 80) {
    return { riskLevel: "High", confidenceScore: score, reasons };
  }

  if (score >= 50) {
    return { riskLevel: "Med", confidenceScore: score, reasons };
  }

  return { riskLevel: "Low", confidenceScore: score, reasons };
}

function synthesizeSummary(payload, monitoring, risk, kycData, adverseMedia) {
  const txId = payload.tx_id || payload.transaction?.txId || "UNKNOWN_TX";
  const kycSummary = kycData.summary || "No explicit KYC risk summary was supplied.";
  const mediaSummary = adverseMedia.summary || adverseMedia.headline || "No adverse media detail was supplied.";

  return `Transaction ${txId} generated ${monitoring.alertGenerated ? "an alert" : "no alert"} with ${risk.riskLevel} AML risk. KYC context: ${kycSummary} Adverse media: ${mediaSummary}`;
}

function buildSarNarrative(payload, risk, monitoring, kycData, adverseMedia) {
  const txId = payload.tx_id || payload.transaction?.txId || "UNKNOWN_TX";
  const subject = payload.subject || payload.customer || {};
  const subjectName = subject.name ? "[REDACTED_SUBJECT]" : "Unknown subject";

  return [
    "SAR DRAFT",
    `Subject: ${subjectName}`,
    `Transaction reference: ${txId}`,
    `Risk level: ${risk.riskLevel}`,
    `Alert rationale: ${monitoring.triggers.join("; ")}`,
    `KYC findings: ${kycData.summary || "No additional KYC findings supplied."}`,
    `Adverse media: ${adverseMedia.summary || adverseMedia.headline || "No adverse media findings supplied."}`,
    "Recommendation: Escalate for senior analyst review before any closure action.",
  ].join(" ");
}

function investigateTransaction(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("AML transaction payload must be a JSON object.");
  }

  const txId = payload.tx_id || payload.transaction?.txId;
  if (!txId) {
    throw new Error("The 'tx_id' field is required for /check_transaction.");
  }

  const investigationId = payload.case_id || `aml-${crypto.randomUUID()}`;
  const audit = buildAuditRecorder("/check_transaction", txId);
  const sanitizedPayload = sanitizeObject(payload);

  audit.record(
    "transaction_monitoring",
    "Check transaction data for layering, abrupt geographical shifts, and velocity anomalies.",
    sanitizedPayload.transaction || sanitizedPayload,
  );

  const monitoring = analyzeMonitoring(payload.transaction || payload);
  audit.record(
    "alert_decision",
    "Generate an AML alert when anomaly triggers or risk score exceeds the monitoring threshold.",
    monitoring,
  );

  const kycData = payload.internal_kyc_vault || {};
  audit.record(
    "internal_kyc_vault_lookup",
    "Gather internal KYC context to support the investigation loop.",
    kycData,
  );

  const adverseMedia = payload.adverse_media_api || {};
  audit.record(
    "adverse_media_query",
    "Review supplied adverse media results for negative news or reputational risk.",
    adverseMedia,
  );

  const summaryInput = {
    monitoring,
    kyc: sanitizeObject(kycData),
    adverseMedia: sanitizeObject(adverseMedia),
  };
  audit.record(
    "summarizer_tool",
    "Synthesize the investigation evidence into an explainable case summary.",
    summaryInput,
  );

  const risk = determineRiskLevel(monitoring, kycData, adverseMedia);
  audit.record(
    "risk_determination",
    "Assign Low, Med, or High AML risk using explainable evidence from monitoring, KYC, and adverse media.",
    risk,
  );

  const alertGenerated = monitoring.alertGenerated;
  const sarRequired = risk.riskLevel === "High";
  const requiresSeniorReview = sarRequired;
  const recommendedActions = [];

  if (alertGenerated) {
    recommendedActions.push("Open or continue AML investigation workflow");
  }

  if (risk.riskLevel === "Low") {
    recommendedActions.push("Continue monitoring with documented rationale");
  }

  if (risk.riskLevel === "Med") {
    recommendedActions.push("Escalate to analyst queue for enhanced review");
    recommendedActions.push("Refresh KYC profile and verify transaction purpose");
  }

  if (sarRequired) {
    recommendedActions.push("Draft SAR narrative");
    recommendedActions.push("Do not close without analyst_id_101 review");
  }

  const sarNarrative = sarRequired
    ? buildSarNarrative(payload, risk, monitoring, kycData, adverseMedia)
    : null;

  if (sarNarrative) {
    audit.record(
      "sar_drafting",
      "Generate SAR draft because the case is high risk under the AML investigation policy.",
      { sarNarrative },
    );
  }

  const result = {
    agent: "AML-Pro-Agent",
    version: "2026.1",
    command: "/check_transaction",
    investigationId,
    txId,
    status: alertGenerated ? "ALERT_GENERATED" : "NO_ALERT",
    riskLevel: risk.riskLevel,
    alertConfidence: risk.confidenceScore,
    caseSummary: synthesizeSummary(payload, monitoring, risk, kycData, adverseMedia),
    recommendedActions,
    requiresSeniorAnalystReview: requiresSeniorReview,
    requiredReviewer: requiresSeniorReview ? "analyst_id_101" : null,
    sarDraft: sarNarrative,
    explainability: {
      why: risk.reasons,
      evidence: {
        transactionMonitoring: monitoring,
        kyc: sanitizeObject(kycData),
        adverseMedia: sanitizeObject(adverseMedia),
      },
    },
    audit: {
      directory: auditDirectory,
      steps: audit.steps,
    },
  };

  audit.record(
    "finalize_response",
    "Return JSON-only AML investigation output for system integration and auditability.",
    {
      status: result.status,
      riskLevel: result.riskLevel,
      alertConfidence: result.alertConfidence,
      requiresSeniorAnalystReview: result.requiresSeniorAnalystReview,
    },
  );

  return result;
}

function reviewCase(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("AML case review payload must be a JSON object.");
  }

  const caseId = payload.case_id;
  if (!caseId) {
    throw new Error("The 'case_id' field is required for /review_case.");
  }

  const audit = buildAuditRecorder("/review_case", caseId);
  const riskLevel = payload.riskLevel || "Med";
  const analystId = payload.review?.analystId || null;
  const canClose = !(riskLevel === "High" && analystId !== "analyst_id_101");

  audit.record(
    "case_review",
    "Review pending AML case for submission and verify whether high-risk closure controls are satisfied.",
    sanitizeObject(payload),
  );

  const recommendedActions = [];

  if (riskLevel === "High" && analystId !== "analyst_id_101") {
    recommendedActions.push("Hold case open until analyst_id_101 reviews the investigation");
    recommendedActions.push("Submit SAR draft for senior analyst validation");
  } else if (riskLevel === "High") {
    recommendedActions.push("Proceed with senior analyst escalation workflow and filing preparation");
  } else if (riskLevel === "Med") {
    recommendedActions.push("Route to enhanced due diligence review queue");
  } else {
    recommendedActions.push("Maintain documented monitoring trail and periodic review cadence");
  }

  const result = {
    agent: "AML-Pro-Agent",
    version: "2026.1",
    command: "/review_case",
    caseId,
    reviewStatus: canClose ? "READY_FOR_SUBMISSION" : "PENDING_SENIOR_REVIEW",
    riskLevel,
    confidenceScore: toConfidence(payload.confidenceScore || 72),
    caseSummary: payload.caseSummary || "Pending AML case reviewed for explainability, audit, and submission readiness.",
    recommendedActions,
    requiresSeniorAnalystReview: riskLevel === "High",
    requiredReviewer: riskLevel === "High" ? "analyst_id_101" : null,
    explainability: {
      why: [
        "High-risk cases cannot be closed without senior analyst review.",
        "Explainable-only decisions require documented rationale and evidence.",
      ],
      evidence: sanitizeObject(payload.evidence || payload),
    },
    audit: {
      directory: auditDirectory,
      steps: audit.steps,
    },
  };

  audit.record(
    "review_decision",
    "Return a JSON-only case review result that preserves the human-in-the-loop control for high-risk investigations.",
    {
      reviewStatus: result.reviewStatus,
      requiredReviewer: result.requiredReviewer,
      confidenceScore: result.confidenceScore,
    },
  );

  return result;
}

module.exports = {
  investigateTransaction,
  reviewCase,
  anonymizePii,
};
