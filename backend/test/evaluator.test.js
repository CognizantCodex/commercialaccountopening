const assert = require("node:assert/strict");
const { evaluateRequest } = require("../src/evaluator");
const { investigateTransaction, reviewCase, anonymizePii } = require("../src/amlAgent");

const kycResult = evaluateRequest({
  stage: "KYC",
  aggregatedOcrSummary: "Active status with certificate of formation and beneficial owner identified.",
  document: { ocrText: "Managing member listed consistently in registration packet." },
  notes: "Consistent registration and ownership details.",
});
assert.equal(kycResult.stage, "KYC");
assert.equal(kycResult.decision, "APPROVED");
assert.ok(kycResult.confidence >= 90);

const creditResult = evaluateRequest({
  stage: "CREDIT",
  aggregatedOcrSummary: "Credit review shows delinquent obligations and collections activity.",
  notes: "Prior default noted in the supplied business risk context.",
});
assert.equal(creditResult.decision, "REJECTED");

const riskResult = evaluateRequest({
  stage: "RISK",
  priorStageDecisions: [
    { stage: "DOCUMENT_REVIEW", decision: "APPROVED" },
    { stage: "KYC", decision: "MANUAL_REVIEW" },
    { stage: "CREDIT", decision: "APPROVED" },
  ],
});
assert.equal(riskResult.decision, "MANUAL_REVIEW");

const amlInvestigation = investigateTransaction({
  tx_id: "TX-42",
  transaction: {
    txId: "TX-42",
    description: "Layering activity with abrupt geographical shift",
    geoShift: true,
    layeringIndicator: true,
  },
  internal_kyc_vault: {
    summary: "Customer is in enhanced due diligence population.",
  },
  adverse_media_api: {
    summary: "Negative article references possible money laundering investigation.",
  },
});
assert.equal(amlInvestigation.agent, "AML-Pro-Agent");
assert.equal(amlInvestigation.status, "ALERT_GENERATED");
assert.equal(amlInvestigation.riskLevel, "High");
assert.equal(amlInvestigation.requiresSeniorAnalystReview, true);
assert.ok(Array.isArray(amlInvestigation.audit.steps));

const amlReview = reviewCase({
  case_id: "CASE-42",
  riskLevel: "High",
  review: {
    analystId: "analyst_id_101",
  },
});
assert.equal(amlReview.reviewStatus, "READY_FOR_SUBMISSION");

assert.equal(anonymizePii("customer@example.com"), "[REDACTED_EMAIL]");

console.log("Backend evaluator tests passed.");
