package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.modules.activity.ActivityItemEntity;
import com.kycnorthstar.platform.modules.agents.AgentExecutionEntity;
import com.kycnorthstar.platform.modules.cases.CaseStage;
import com.kycnorthstar.platform.modules.cases.CaseStatus;
import com.kycnorthstar.platform.modules.cases.ComplianceCaseEntity;
import com.kycnorthstar.platform.modules.evidence.DocumentSubmissionEntity;
import com.kycnorthstar.platform.modules.governance.DecisionEvidenceEntity;
import com.kycnorthstar.platform.modules.governance.DecisionReasoningStepEntity;
import com.kycnorthstar.platform.modules.governance.DecisionRecordEntity;
import com.kycnorthstar.platform.modules.monitoring.MonitoringAlertEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipGroup;
import com.kycnorthstar.platform.modules.ownership.OwnershipPartyEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipRelationshipEntity;
import com.kycnorthstar.platform.modules.policy.PolicyCheckResultEntity;
import com.kycnorthstar.platform.modules.parties.CustomerOrganizationEntity;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PlatformMapper {

  public PlatformModels.CaseRecord toCaseRecord(
      ComplianceCaseEntity entity,
      List<DocumentSubmissionEntity> documents,
      List<PolicyCheckResultEntity> policyChecks,
      List<OwnershipPartyEntity> parties,
      List<OwnershipRelationshipEntity> relationships
  ) {
    return new PlatformModels.CaseRecord(
        entity.getId(),
        entity.getClientId(),
        entity.getCaseName(),
        entity.getPriority().name(),
        toStage(entity.getStage()),
        toStatus(entity.getStatus()),
        entity.getJurisdiction(),
        entity.getRegion(),
        entity.getRiskScore(),
        entity.isStpEligible(),
        entity.isFirstTimeRight(),
        entity.getOnboardingHours(),
        entity.getAssignedTo(),
        entity.getCompleteness(),
        documents.stream().map(this::toDocument).toList(),
        policyChecks.stream().map(this::toPolicyCheck).toList(),
        entity.getNarrative(),
        entity.getNextBestAction(),
        new PlatformModels.OwnershipGraph(
            parties.stream().map(this::toOwnershipParty).toList(),
            relationships.stream().map(this::toOwnershipRelationship).toList()
        )
    );
  }

  public PlatformModels.ClientRecord toClientRecord(CustomerOrganizationEntity entity) {
    return new PlatformModels.ClientRecord(
        entity.getId(),
        entity.getName(),
        entity.getSegment(),
        entity.getHeadquarters(),
        entity.getRegion(),
        List.of(entity.getLongitude(), entity.getLatitude()),
        entity.getSector(),
        entity.getAnnualRevenueUsd()
    );
  }

  public PlatformModels.DocumentSubmission toDocument(DocumentSubmissionEntity entity) {
    List<String> extractedFields = entity.getExtractedFields().isBlank()
        ? List.of()
        : Arrays.stream(entity.getExtractedFields().split(",")).map(String::trim).toList();
    return new PlatformModels.DocumentSubmission(
        entity.getId(),
        entity.getType(),
        entity.getStatus().name(),
        entity.getCompleteness(),
        entity.getUploadedAt(),
        extractedFields
    );
  }

  public PlatformModels.PolicyCheckResult toPolicyCheck(PolicyCheckResultEntity entity) {
    String status = entity.getStatus().name().replace('_', '-');
    return new PlatformModels.PolicyCheckResult(entity.getId(), entity.getLabel(), status, entity.getRationale());
  }

  public PlatformModels.OwnershipParty toOwnershipParty(OwnershipPartyEntity entity) {
    return new PlatformModels.OwnershipParty(
        entity.getId(),
        entity.getName(),
        entity.getRole(),
        entity.getGroupName().name().replace('_', '-')
    );
  }

  public PlatformModels.OwnershipRelationship toOwnershipRelationship(OwnershipRelationshipEntity entity) {
    return new PlatformModels.OwnershipRelationship(entity.getSourceId(), entity.getTargetId(), entity.getWeightValue());
  }

  public PlatformModels.MonitoringAlert toMonitoringAlert(MonitoringAlertEntity entity) {
    return new PlatformModels.MonitoringAlert(
        entity.getId(),
        entity.getCaseId(),
        entity.getClientId(),
        entity.getTitle(),
        entity.getSeverity().name(),
        entity.getRegion(),
        List.of(entity.getLongitude(), entity.getLatitude()),
        entity.getEventTime(),
        entity.getFalsePositiveRisk(),
        entity.getDescription()
    );
  }

  public PlatformModels.DecisionLog toDecisionLog(
      DecisionRecordEntity entity,
      List<DecisionReasoningStepEntity> reasoningSteps,
      List<DecisionEvidenceEntity> evidence
  ) {
    return new PlatformModels.DecisionLog(
        entity.getId(),
        entity.getCaseId(),
        entity.getTitle(),
        entity.getActor(),
        entity.getDecision().name(),
        entity.getConfidence(),
        entity.getOverrideReason(),
        entity.getCreatedAt(),
        reasoningSteps.stream().map(DecisionReasoningStepEntity::getContent).toList(),
        evidence.stream().map(this::toDecisionEvidence).toList()
    );
  }

  public PlatformModels.DecisionEvidence toDecisionEvidence(DecisionEvidenceEntity entity) {
    return new PlatformModels.DecisionEvidence(
        entity.getId(),
        entity.getLabel(),
        entity.getType(),
        entity.getConfidence(),
        entity.getExcerpt()
    );
  }

  public PlatformModels.AgentRecord toAgentRecord(AgentExecutionEntity entity) {
    return new PlatformModels.AgentRecord(
        entity.getId(),
        entity.getName(),
        entity.getRole(),
        entity.getStatus().name(),
        entity.getLatencyMs(),
        entity.getTasksProcessed(),
        entity.getAutoShare(),
        entity.getManualShare(),
        entity.getPulseMessage()
    );
  }

  public PlatformModels.ActivityItem toActivityItem(ActivityItemEntity entity) {
    return new PlatformModels.ActivityItem(
        entity.getId(),
        entity.getTitle(),
        entity.getDescription(),
        entity.getTimestamp(),
        entity.getSeverity().name(),
        entity.getRouteHint().name()
    );
  }

  private String toStage(CaseStage stage) {
    return switch (stage) {
      case INTAKE -> "intake";
      case EVIDENCE_COLLECTION, CLASSIFICATION -> "classification";
      case QC_EVALUATION, STP_APPROVAL -> "quality-check";
      case ADVISOR_EXCEPTION, OPERATIONS_EXCEPTION -> "advisor-review";
      case ACTIVE_MONITORING -> "monitoring";
      case GOVERNANCE_REVIEW, CLOSED -> "governance";
    };
  }

  private String toStatus(CaseStatus status) {
    return status.name().replace('_', '-');
  }
}
