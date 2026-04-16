import { submitCheckRiskApplication } from "../checkRiskApi.js";

function createCheck({
  key,
  label,
  decision,
  summary,
  flags = [],
  score = null,
  integration = null,
}) {
  return {
    key,
    label,
    status: "completed",
    decision,
    summary,
    flags,
    score,
    integration,
  };
}

function mapRiskDecision(response) {
  switch (String(response ?? "").toLowerCase()) {
    case "high":
      return "high";
    case "moderate":
      return "moderate";
    default:
      return "low";
  }
}

export async function runRiskAgent(workspace) {
  const checkRiskTransmission = await submitCheckRiskApplication(workspace);
  const response = checkRiskTransmission.response;
  const decision = mapRiskDecision(response.response);
  const flags = [];

  if (response.transmissionMode === "simulated") {
    flags.push(
      "checkRisk API is running in simulated mode until an external endpoint is configured.",
    );
  }
  if (response.recommendation) {
    flags.push(response.recommendation);
  }

  const summary =
    decision === "high"
      ? "Risk agent completed review and identified a high-risk profile."
      : decision === "moderate"
        ? "Risk agent completed review and identified a moderate-risk profile."
        : "Risk agent completed review and identified a low-risk profile.";

  return createCheck({
    key: "risk",
    label: "Risk",
    decision,
    summary,
    flags,
    score: response.riskScore,
    integration: {
      checkRisk: {
        response: response.response,
        riskScore: response.riskScore,
        recommendation: response.recommendation,
        endpoint: response.endpoint,
        provider: response.provider,
        transmissionMode: response.transmissionMode,
        externalAssessmentId: response.externalAssessmentId,
        receivedAt: response.receivedAt,
        message: response.message,
      },
    },
  });
}
