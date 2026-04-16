const assert = require("node:assert/strict");
const { evaluateRequest } = require("../src/evaluator");

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

console.log("Backend evaluator tests passed.");
