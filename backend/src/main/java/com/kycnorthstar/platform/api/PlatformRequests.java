package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.modules.governance.GovernanceDecision;
import com.kycnorthstar.platform.shared.Severity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class PlatformRequests {

  private PlatformRequests() {
  }

  public record CreateCaseRequest(
      @NotBlank String clientId,
      @NotBlank String caseName,
      @NotBlank String jurisdiction
  ) {
  }

  public record CreateDocumentRequest(
      @NotBlank String documentType,
      @NotEmpty List<String> extractedFields
  ) {
  }

  public record EvaluateQcRequest(@NotBlank String actor) {
  }

  public record ResolveTaskRequest(
      @NotBlank String actor,
      @NotBlank String note
  ) {
  }

  public record StartMonitoringRequest(
      @NotBlank String title,
      @NotNull Severity severity,
      @NotBlank String description,
      @Min(0) @Max(100) int falsePositiveRisk
  ) {
  }

  public record CreateGovernanceDecisionRequest(
      @NotBlank String caseId,
      @NotBlank String title,
      @NotBlank String actor,
      @NotNull GovernanceDecision decision,
      @Min(0) @Max(100) int confidence,
      String overrideReason,
      @NotEmpty List<String> reasoningChain
  ) {
  }
}
