package com.kycnorthstar.platform.api;

import com.kycnorthstar.platform.modules.activity.ActivityItemEntity;
import com.kycnorthstar.platform.modules.activity.ActivityItemRepository;
import com.kycnorthstar.platform.modules.agents.AgentExecutionEntity;
import com.kycnorthstar.platform.modules.agents.AgentExecutionRepository;
import com.kycnorthstar.platform.modules.cases.CasePriority;
import com.kycnorthstar.platform.modules.cases.CaseStage;
import com.kycnorthstar.platform.modules.cases.CaseStatus;
import com.kycnorthstar.platform.modules.cases.ComplianceCaseEntity;
import com.kycnorthstar.platform.modules.cases.ComplianceCaseRepository;
import com.kycnorthstar.platform.modules.evidence.DocumentSubmissionEntity;
import com.kycnorthstar.platform.modules.evidence.DocumentSubmissionRepository;
import com.kycnorthstar.platform.modules.governance.DecisionEvidenceEntity;
import com.kycnorthstar.platform.modules.governance.DecisionEvidenceRepository;
import com.kycnorthstar.platform.modules.governance.DecisionReasoningStepEntity;
import com.kycnorthstar.platform.modules.governance.DecisionReasoningStepRepository;
import com.kycnorthstar.platform.modules.governance.DecisionRecordEntity;
import com.kycnorthstar.platform.modules.governance.DecisionRecordRepository;
import com.kycnorthstar.platform.modules.governance.GovernanceDecision;
import com.kycnorthstar.platform.modules.monitoring.MonitoringAlertEntity;
import com.kycnorthstar.platform.modules.monitoring.MonitoringAlertRepository;
import com.kycnorthstar.platform.modules.ownership.OwnershipPartyEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipPartyRepository;
import com.kycnorthstar.platform.modules.ownership.OwnershipRelationshipEntity;
import com.kycnorthstar.platform.modules.ownership.OwnershipRelationshipRepository;
import com.kycnorthstar.platform.modules.policy.PolicyCheckResultEntity;
import com.kycnorthstar.platform.modules.policy.PolicyCheckResultRepository;
import com.kycnorthstar.platform.modules.policy.PolicyCheckStatus;
import com.kycnorthstar.platform.modules.parties.CustomerOrganizationRepository;
import com.kycnorthstar.platform.shared.DashboardRoute;
import com.kycnorthstar.platform.shared.ResourceNotFoundException;
import com.kycnorthstar.platform.shared.Severity;
import java.text.DecimalFormat;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class PlatformService {

  private final ComplianceCaseRepository caseRepository;
  private final DocumentSubmissionRepository documentRepository;
  private final PolicyCheckResultRepository policyRepository;
  private final OwnershipPartyRepository ownershipPartyRepository;
  private final OwnershipRelationshipRepository ownershipRelationshipRepository;
  private final MonitoringAlertRepository monitoringAlertRepository;
  private final DecisionRecordRepository decisionRecordRepository;
  private final DecisionReasoningStepRepository reasoningStepRepository;
  private final DecisionEvidenceRepository decisionEvidenceRepository;
  private final AgentExecutionRepository agentRepository;
  private final ActivityItemRepository activityRepository;
  private final CustomerOrganizationRepository customerOrganizationRepository;
  private final PlatformMapper mapper;

  public PlatformService(
      ComplianceCaseRepository caseRepository,
      DocumentSubmissionRepository documentRepository,
      PolicyCheckResultRepository policyRepository,
      OwnershipPartyRepository ownershipPartyRepository,
      OwnershipRelationshipRepository ownershipRelationshipRepository,
      MonitoringAlertRepository monitoringAlertRepository,
      DecisionRecordRepository decisionRecordRepository,
      DecisionReasoningStepRepository reasoningStepRepository,
      DecisionEvidenceRepository decisionEvidenceRepository,
      AgentExecutionRepository agentRepository,
      ActivityItemRepository activityRepository,
      CustomerOrganizationRepository customerOrganizationRepository,
      PlatformMapper mapper
  ) {
    this.caseRepository = caseRepository;
    this.documentRepository = documentRepository;
    this.policyRepository = policyRepository;
    this.ownershipPartyRepository = ownershipPartyRepository;
    this.ownershipRelationshipRepository = ownershipRelationshipRepository;
    this.monitoringAlertRepository = monitoringAlertRepository;
    this.decisionRecordRepository = decisionRecordRepository;
    this.reasoningStepRepository = reasoningStepRepository;
    this.decisionEvidenceRepository = decisionEvidenceRepository;
    this.agentRepository = agentRepository;
    this.activityRepository = activityRepository;
    this.customerOrganizationRepository = customerOrganizationRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public PlatformModels.PlatformSnapshotResponse getPlatformSnapshot() {
    List<ComplianceCaseEntity> cases = caseRepository.findAllByOrderByCaseNameAsc();
    List<PlatformModels.ClientRecord> clients = customerOrganizationRepository.findAll().stream()
        .map(mapper::toClientRecord)
        .sorted(Comparator.comparing(PlatformModels.ClientRecord::name))
        .toList();
    List<PlatformModels.CaseRecord> caseRecords = cases.stream().map(this::toCaseRecord).toList();
    List<PlatformModels.AgentRecord> agentRecords = agentRepository.findAllByOrderByNameAsc().stream().map(mapper::toAgentRecord).toList();
    List<PlatformModels.ActivityItem> activityFeed = activityRepository.findAllByOrderByTimestampDesc().stream().map(mapper::toActivityItem).toList();
    List<PlatformModels.MonitoringAlert> alerts = monitoringAlertRepository.findAllByOrderByEventTimeDesc().stream().map(mapper::toMonitoringAlert).toList();
    List<PlatformModels.DecisionLog> decisions = decisionRecordRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDecisionLog).toList();

    List<PlatformModels.TimelineEvent> timeline = buildTimeline();

    return new PlatformModels.PlatformSnapshotResponse(
        clients,
        caseRecords,
        timeline,
        buildKpis(cases),
        buildRegionPerformance(cases),
        buildTrendSeries(),
        buildDonutSlices(cases),
        agentRecords,
        activityFeed,
        buildConfidenceMatrix(),
        buildTaskThroughput(agentRepository.findAllByOrderByNameAsc()),
        alerts,
        alerts.isEmpty() ? 0 : (int) Math.round(alerts.stream().mapToInt(PlatformModels.MonitoringAlert::falsePositiveRisk).average().orElse(0)),
        buildRiskHistogram(alerts),
        decisions,
        buildFairnessSeries(decisions),
        buildHumanOverrideRate(decisions),
        new PlatformModels.DemoSnapshot(true, timeline, 0)
    );
  }

  @Transactional(readOnly = true)
  public List<PlatformModels.CaseRecord> listCases() {
    return caseRepository.findAllByOrderByCaseNameAsc().stream().map(this::toCaseRecord).toList();
  }

  @Transactional(readOnly = true)
  public PlatformModels.CaseRecord getCase(String caseId) {
    return toCaseRecord(findCase(caseId));
  }

  @Transactional
  public PlatformModels.CaseRecord createCase(PlatformRequests.CreateCaseRequest request) {
    ComplianceCaseEntity entity = new ComplianceCaseEntity(
        "case-" + UUID.randomUUID(),
        request.clientId(),
        request.caseName(),
        CasePriority.medium,
        CaseStage.INTAKE,
        CaseStatus.in_flight,
        request.jurisdiction(),
        "North America",
        50,
        false,
        false,
        0.0,
        "Unassigned",
        10,
        "New case created and waiting for evidence collection.",
        "Upload core identity and ownership documents to begin classification."
    );
    caseRepository.save(entity);
    addActivity("Case initiated", request.caseName() + " was created through the platform API.", Severity.info, DashboardRoute.cases);
    return toCaseRecord(entity);
  }

  @Transactional
  public PlatformModels.CaseRecord addDocument(String caseId, PlatformRequests.CreateDocumentRequest request) {
    ComplianceCaseEntity entity = findCase(caseId);
    DocumentSubmissionEntity document = new DocumentSubmissionEntity(
        "doc-" + UUID.randomUUID(),
        caseId,
        request.documentType(),
        com.kycnorthstar.platform.modules.evidence.DocumentStatus.validated,
        96,
        OffsetDateTime.now(),
        String.join(",", request.extractedFields())
    );
    documentRepository.save(document);
    entity.setStage(CaseStage.CLASSIFICATION);
    entity.setCompleteness(Math.min(96, entity.getCompleteness() + 12));
    entity.setNarrative("Fresh onboarding evidence is in, giving the AI layer enough structure to continue classification.");
    entity.setNextBestAction("Wait for the entity-resolution and QC agents to score the new submission.");
    caseRepository.save(entity);
    addActivity("Document received", request.documentType() + " was attached to " + entity.getCaseName() + ".", Severity.success, DashboardRoute.cases);
    return toCaseRecord(entity);
  }

  @Transactional
  public PlatformModels.CaseRecord evaluateQc(String caseId, PlatformRequests.EvaluateQcRequest request) {
    ComplianceCaseEntity entity = findCase(caseId);
    List<PolicyCheckResultEntity> checks = policyRepository.findAllByCaseIdOrderByLabelAsc(caseId);
    boolean hasFailures = checks.stream().anyMatch(check -> check.getStatus() == PolicyCheckStatus.failed);
    if (hasFailures) {
      entity.setStage(CaseStage.ADVISOR_EXCEPTION);
      entity.setStatus(CaseStatus.exception);
      entity.setNarrative("QC evaluation confirmed unresolved policy exceptions that require human remediation.");
      entity.setNextBestAction("Resolve the failed QC rule before returning the case to straight-through processing.");
      addActivity("QC exception confirmed", request.actor() + " reran QC and the case remains in exception handling.", Severity.warning, DashboardRoute.agents);
    } else {
      entity.setStage(CaseStage.STP_APPROVAL);
      entity.setStatus(CaseStatus.in_flight);
      entity.setStpEligible(true);
      entity.setNarrative("All QC controls now pass and the case is ready for STP approval.");
      entity.setNextBestAction("Review the approval package and move the case into monitoring.");
      addActivity("QC passed", request.actor() + " reran QC and cleared the case for STP approval.", Severity.success, DashboardRoute.agents);
    }
    caseRepository.save(entity);
    return toCaseRecord(entity);
  }

  @Transactional
  public PlatformModels.CaseRecord resolveTask(String caseId, String taskId, PlatformRequests.ResolveTaskRequest request) {
    ComplianceCaseEntity entity = findCase(caseId);
    List<PolicyCheckResultEntity> checks = policyRepository.findAllByCaseIdOrderByLabelAsc(caseId);
    checks.stream()
        .filter(check -> check.getStatus() != PolicyCheckStatus.passed)
        .forEach(check -> {
          check.setStatus(PolicyCheckStatus.passed);
          check.setRationale(request.note());
        });
    policyRepository.saveAll(checks);

    entity.setStage(CaseStage.ACTIVE_MONITORING);
    entity.setStatus(CaseStatus.resolved);
    entity.setStpEligible(true);
    entity.setFirstTimeRight(true);
    entity.setCompleteness(96);
    entity.setRiskScore(Math.max(42, entity.getRiskScore() - 10));
    entity.setOnboardingHours(Math.max(18.0, entity.getOnboardingHours() - 3.5));
    entity.setNarrative("Human intervention cleared the one broken control and returned the case to a monitored state.");
    entity.setNextBestAction("Monitor post-onboarding signals and escalate only if a material event appears.");
    caseRepository.save(entity);

    addActivity("Advisor remediation applied", request.actor() + " resolved task " + taskId + " and cleared the case for monitoring.", Severity.success, DashboardRoute.cases);
    return toCaseRecord(entity);
  }

  @Transactional
  public PlatformModels.MonitoringAlert startMonitoring(String caseId, PlatformRequests.StartMonitoringRequest request) {
    ComplianceCaseEntity entity = findCase(caseId);
    entity.setStage(CaseStage.ACTIVE_MONITORING);
    entity.setStatus(CaseStatus.monitored);
    entity.setNarrative("Onboarding is complete, but the client now sits under an active continuous KYC pulse.");
    entity.setNextBestAction("Review the monitoring alert and determine whether governance escalation is required.");
    caseRepository.save(entity);

    MonitoringAlertEntity alert = new MonitoringAlertEntity(
        "alert-" + UUID.randomUUID(),
        entity.getId(),
        entity.getClientId(),
        request.title(),
        request.severity(),
        entity.getRegion(),
        51.5072,
        -0.1276,
        OffsetDateTime.now(),
        request.falsePositiveRisk(),
        request.description()
    );
    monitoringAlertRepository.save(alert);
    addActivity("Monitoring alert created", request.title() + " is now attached to " + entity.getCaseName() + ".", request.severity(), DashboardRoute.monitoring);
    return mapper.toMonitoringAlert(alert);
  }

  @Transactional
  public PlatformModels.DecisionLog createGovernanceDecision(PlatformRequests.CreateGovernanceDecisionRequest request) {
    ComplianceCaseEntity entity = findCase(request.caseId());
    entity.setStage(CaseStage.GOVERNANCE_REVIEW);
    entity.setNarrative("The final decision is now fully explainable with linked evidence, confidence deltas, and review ownership.");
    entity.setNextBestAction("Share the explainability pack with governance and retain it for audit export.");
    caseRepository.save(entity);

    DecisionRecordEntity decision = new DecisionRecordEntity(
        "decision-" + UUID.randomUUID(),
        request.caseId(),
        request.title(),
        request.actor(),
        request.decision(),
        request.confidence(),
        request.overrideReason(),
        OffsetDateTime.now()
    );
    decisionRecordRepository.save(decision);
    reasoningStepRepository.saveAll(
        request.reasoningChain().stream()
            .map(reason -> new DecisionReasoningStepEntity(decision.getId(), request.reasoningChain().indexOf(reason) + 1, reason))
            .toList()
    );
    decisionEvidenceRepository.saveAll(List.of(
        new DecisionEvidenceEntity("source-" + UUID.randomUUID(), decision.getId(), "Advisor dossier", "advisor-note", 84, "Relationship manager supplied a remediation package aligned to the final decision."),
        new DecisionEvidenceEntity("source-" + UUID.randomUUID(), decision.getId(), "Policy evaluation", "screening", Math.max(70, request.confidence() - 4), "Deterministic policy results supported the final governance outcome.")
    ));
    addActivity("Governance decision logged", request.title() + " was recorded for " + entity.getCaseName() + ".", Severity.info, DashboardRoute.governance);
    return toDecisionLog(decision);
  }

  @Transactional(readOnly = true)
  public PlatformModels.ExplainabilityResponse getExplainability(String caseId) {
    findCase(caseId);
    DecisionRecordEntity decision = decisionRecordRepository.findAllByCaseIdOrderByCreatedAtDesc(caseId).stream()
        .findFirst()
        .orElseThrow(() -> new ResourceNotFoundException("No explainability record found for case " + caseId));
    return new PlatformModels.ExplainabilityResponse(caseId, toDecisionLog(decision));
  }

  @Transactional(readOnly = true)
  public SseEmitter streamActivity() {
    SseEmitter emitter = new SseEmitter(5_000L);
    try {
      for (PlatformModels.ActivityItem item : activityRepository.findAllByOrderByTimestampDesc().stream().map(mapper::toActivityItem).toList()) {
        emitter.send(SseEmitter.event().name("activity").data(item));
      }
      emitter.complete();
    } catch (Exception exception) {
      emitter.completeWithError(exception);
    }
    return emitter;
  }

  private ComplianceCaseEntity findCase(String caseId) {
    return caseRepository.findById(caseId)
        .orElseThrow(() -> new ResourceNotFoundException("Case " + caseId + " was not found"));
  }

  private PlatformModels.CaseRecord toCaseRecord(ComplianceCaseEntity entity) {
    return mapper.toCaseRecord(
        entity,
        documentRepository.findAllByCaseIdOrderByUploadedAtAsc(entity.getId()),
        policyRepository.findAllByCaseIdOrderByLabelAsc(entity.getId()),
        ownershipPartyRepository.findAllByCaseIdOrderByNameAsc(entity.getId()),
        ownershipRelationshipRepository.findAllByCaseIdOrderByIdAsc(entity.getId())
    );
  }

  private PlatformModels.DecisionLog toDecisionLog(DecisionRecordEntity entity) {
    return mapper.toDecisionLog(
        entity,
        reasoningStepRepository.findAllByDecisionIdOrderByStepOrderAsc(entity.getId()),
        decisionEvidenceRepository.findAllByDecisionIdOrderByIdAsc(entity.getId())
    );
  }

  private List<PlatformModels.KpiMetric> buildKpis(List<ComplianceCaseEntity> cases) {
    long exceptionCount = cases.stream().filter(caseEntity -> caseEntity.getStatus() == CaseStatus.exception).count();
    double firstTimeRightRate = cases.stream().filter(ComplianceCaseEntity::isFirstTimeRight).count() * 100.0 / Math.max(1, cases.size());
    double stpRate = cases.stream().filter(ComplianceCaseEntity::isStpEligible).count() * 100.0 / Math.max(1, cases.size());
    double averageHours = cases.stream().mapToDouble(ComplianceCaseEntity::getOnboardingHours).average().orElse(0);
    DecimalFormat percentFormat = new DecimalFormat("0");
    DecimalFormat hourFormat = new DecimalFormat("0.0");
    return List.of(
        new PlatformModels.KpiMetric("ftr", "First-Time Right Rate", firstTimeRightRate, percentFormat.format(firstTimeRightRate) + "%", 6.0, "+6 pts", "up", "Advisor remediation is reducing rework before approval.", "executive"),
        new PlatformModels.KpiMetric("nigo", "NIGO Count", exceptionCount, String.valueOf(exceptionCount), -1.0, "-1 case", "down", "Avoidable exceptions are concentrated into one known Aurora address issue.", "cases"),
        new PlatformModels.KpiMetric("stp", "STP Rate", stpRate, percentFormat.format(stpRate) + "%", 8.0, "+8 pts", "up", "Deterministic policy checks are clearing more work without hiding risk.", "executive"),
        new PlatformModels.KpiMetric("flight", "Cases in Flight", cases.size(), String.valueOf(cases.size()), 1.0, "+1 active", "up", "The platform is managing multiple onboarding and governance paths in parallel.", "cases"),
        new PlatformModels.KpiMetric("hours", "Avg Onboarding Time", averageHours, hourFormat.format(averageHours) + " hrs", -2.4, "-2.4 hrs", "down", "Operational handoffs are shrinking as the AI layer pre-assembles evidence.", "executive")
    );
  }

  private List<PlatformModels.RegionPerformance> buildRegionPerformance(List<ComplianceCaseEntity> cases) {
    return List.of(
        new PlatformModels.RegionPerformance("europe", "Europe", 88, 64, (int) cases.stream().filter(caseEntity -> "Europe".equals(caseEntity.getRegion())).count(), List.of(-0.1276, 51.5072)),
        new PlatformModels.RegionPerformance("north-america", "North America", 92, 81, (int) cases.stream().filter(caseEntity -> "North America".equals(caseEntity.getRegion())).count(), List.of(-74.0060, 40.7128)),
        new PlatformModels.RegionPerformance("latin-america", "Latin America", 71, 58, 1, List.of(-46.6333, -23.5505))
    );
  }

  private List<PlatformModels.TrendPoint> buildTrendSeries() {
    return List.of(
        new PlatformModels.TrendPoint("Jan", 7, 46),
        new PlatformModels.TrendPoint("Feb", 6, 53),
        new PlatformModels.TrendPoint("Mar", 4, 61),
        new PlatformModels.TrendPoint("Apr", 3, 68)
    );
  }

  private List<PlatformModels.DonutSlice> buildDonutSlices(List<ComplianceCaseEntity> cases) {
    int stp = (int) cases.stream().filter(ComplianceCaseEntity::isStpEligible).count();
    return List.of(
        new PlatformModels.DonutSlice("STP", stp, "var(--chart-1)"),
        new PlatformModels.DonutSlice("Exceptions", Math.max(1, cases.size() - stp), "var(--chart-3)")
    );
  }

  private List<PlatformModels.ConfidenceCell> buildConfidenceMatrix() {
    return List.of(
        new PlatformModels.ConfidenceCell("UBO Register", "ownership", 96),
        new PlatformModels.ConfidenceCell("Proof of Address", "registered-address", 54),
        new PlatformModels.ConfidenceCell("Registry Extract", "legal-name", 97),
        new PlatformModels.ConfidenceCell("Trust Deed", "beneficiary", 95)
    );
  }

  private List<PlatformModels.TaskThroughputPoint> buildTaskThroughput(List<AgentExecutionEntity> agents) {
    return agents.stream()
        .map(agent -> new PlatformModels.TaskThroughputPoint(agent.getName(), agent.getTasksProcessed(), (int) Math.round(agent.getTasksProcessed() * (agent.getAutoShare() / 100.0)), (int) Math.round(agent.getTasksProcessed() * (agent.getManualShare() / 100.0))))
        .toList();
  }

  private List<PlatformModels.HistogramPoint> buildRiskHistogram(List<PlatformModels.MonitoringAlert> alerts) {
    int low = (int) alerts.stream().filter(alert -> alert.falsePositiveRisk() < 25).count();
    int medium = (int) alerts.stream().filter(alert -> alert.falsePositiveRisk() >= 25 && alert.falsePositiveRisk() < 60).count();
    int high = (int) alerts.stream().filter(alert -> alert.falsePositiveRisk() >= 60).count();
    return List.of(
        new PlatformModels.HistogramPoint("Low", low),
        new PlatformModels.HistogramPoint("Medium", medium),
        new PlatformModels.HistogramPoint("High", high)
    );
  }

  private List<PlatformModels.FairnessPoint> buildFairnessSeries(List<PlatformModels.DecisionLog> decisions) {
    int overrides = (int) decisions.stream().filter(decision -> "overridden".equals(decision.decision())).count();
    return List.of(
        new PlatformModels.FairnessPoint("High risk", 0.96, overrides),
        new PlatformModels.FairnessPoint("Medium risk", 0.99, 0),
        new PlatformModels.FairnessPoint("Low risk", 1.01, 0)
    );
  }

  private double buildHumanOverrideRate(List<PlatformModels.DecisionLog> decisions) {
    if (decisions.isEmpty()) {
      return 0;
    }
    double overrides = decisions.stream().filter(decision -> "overridden".equals(decision.decision())).count();
    return Math.round((overrides * 1000.0 / decisions.size())) / 10.0;
  }

  private List<PlatformModels.TimelineEvent> buildTimeline() {
    return List.of(
        new PlatformModels.TimelineEvent("timeline-1", 0, OffsetDateTime.parse("2026-04-16T08:00:00Z"), "document_uploaded", "Document uploaded", "Aurora UBO evidence arrived from the advisor channel.", "info", "case-aurora-001", "client-aurora", "cases"),
        new PlatformModels.TimelineEvent("timeline-2", 45_000, OffsetDateTime.parse("2026-04-16T08:05:00Z"), "agent_classified", "Agent classification completed", "Entity-resolution completed the ownership chain.", "success", "case-aurora-001", "client-aurora", "agents"),
        new PlatformModels.TimelineEvent("timeline-3", 75_000, OffsetDateTime.parse("2026-04-16T08:12:00Z"), "qc_failed", "QC rule failed", "The quality-check agent isolated a registered-address mismatch.", "warning", "case-aurora-001", "client-aurora", "cases"),
        new PlatformModels.TimelineEvent("timeline-4", 130_000, OffsetDateTime.parse("2026-04-16T08:25:00Z"), "advisor_resolved", "Advisor resolved exception", "A notarized address certificate cleared the last blocking control.", "success", "case-aurora-001", "client-aurora", "cases"),
        new PlatformModels.TimelineEvent("timeline-5", 180_000, OffsetDateTime.parse("2026-04-16T08:40:00Z"), "monitoring_alert", "Monitoring alert created", "Continuous KYC surfaced a material post-onboarding signal.", "critical", "case-aurora-001", "client-aurora", "monitoring"),
        new PlatformModels.TimelineEvent("timeline-6", 240_000, OffsetDateTime.parse("2026-04-16T08:55:00Z"), "governance_logged", "Governance decision logged", "The final decision package is ready for explainability review.", "info", "case-aurora-001", "client-aurora", "governance")
    );
  }

  private void addActivity(String title, String description, Severity severity, DashboardRoute route) {
    activityRepository.save(new ActivityItemEntity(
        "activity-" + UUID.randomUUID(),
        title,
        description,
        OffsetDateTime.now(),
        severity,
        route
    ));
  }
}
