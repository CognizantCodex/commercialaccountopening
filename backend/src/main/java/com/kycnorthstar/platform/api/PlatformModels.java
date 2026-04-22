package com.kycnorthstar.platform.api;

import java.time.OffsetDateTime;
import java.util.List;

public final class PlatformModels {

  private PlatformModels() {
  }

  public record PlatformSnapshotResponse(
      List<ClientRecord> clients,
      List<CaseRecord> cases,
      List<TimelineEvent> timeline,
      List<KpiMetric> kpis,
      List<RegionPerformance> regionPerformance,
      List<TrendPoint> trendSeries,
      List<DonutSlice> donutSlices,
      List<AgentRecord> agents,
      List<ActivityItem> activityFeed,
      List<ConfidenceCell> confidenceMatrix,
      List<TaskThroughputPoint> taskThroughput,
      List<MonitoringAlert> alerts,
      int falsePositiveGauge,
      List<HistogramPoint> riskHistogram,
      List<DecisionLog> decisionLogs,
      List<FairnessPoint> fairnessSeries,
      double humanOverrideRate,
      DemoSnapshot demo
  ) {
  }

  public record ClientRecord(
      String id,
      String name,
      String segment,
      String headquarters,
      String region,
      List<Double> coordinates,
      String sector,
      long annualRevenueUsd
  ) {
  }

  public record KpiMetric(
      String id,
      String label,
      double value,
      String displayValue,
      Double delta,
      String deltaLabel,
      String trend,
      String narrative,
      String route
  ) {
  }

  public record RegionPerformance(
      String id,
      String label,
      double performance,
      double stpRate,
      int bubbleValue,
      List<Double> centroid
  ) {
  }

  public record TrendPoint(String month, int nigo, int stp) {
  }

  public record DonutSlice(String name, int value, String color) {
  }

  public record AgentRecord(
      String id,
      String name,
      String role,
      String status,
      int latencyMs,
      int tasksProcessed,
      int autoShare,
      int manualShare,
      String pulseMessage
  ) {
  }

  public record ActivityItem(
      String id,
      String title,
      String description,
      OffsetDateTime timestamp,
      String severity,
      String routeHint
  ) {
  }

  public record ConfidenceCell(String docType, String field, int confidence) {
  }

  public record TaskThroughputPoint(String agent, int tasks, int auto, int manual) {
  }

  public record CaseRecord(
      String id,
      String clientId,
      String caseName,
      String priority,
      String stage,
      String status,
      String jurisdiction,
      String region,
      int riskScore,
      boolean stpEligible,
      boolean firstTimeRight,
      double onboardingHours,
      String assignedTo,
      int completeness,
      List<DocumentSubmission> documents,
      List<PolicyCheckResult> qcRules,
      String narrative,
      String nextBestAction,
      OwnershipGraph ownershipGraph
  ) {
  }

  public record DocumentSubmission(
      String id,
      String type,
      String status,
      int completeness,
      OffsetDateTime uploadedAt,
      List<String> extractedFields
  ) {
  }

  public record PolicyCheckResult(String id, String label, String status, String rationale) {
  }

  public record OwnershipGraph(List<OwnershipParty> nodes, List<OwnershipRelationship> links) {
  }

  public record OwnershipParty(String id, String name, String role, String group) {
  }

  public record OwnershipRelationship(String source, String target, int weight) {
  }

  public record MonitoringAlert(
      String id,
      String caseId,
      String clientId,
      String title,
      String severity,
      String region,
      List<Double> coordinates,
      OffsetDateTime eventTime,
      int falsePositiveRisk,
      String description
  ) {
  }

  public record HistogramPoint(String bucket, int count) {
  }

  public record DecisionLog(
      String id,
      String caseId,
      String title,
      String actor,
      String decision,
      int confidence,
      String overrideReason,
      OffsetDateTime createdAt,
      List<String> reasoningChain,
      List<DecisionEvidence> sources
  ) {
  }

  public record DecisionEvidence(String id, String label, String type, int confidence, String excerpt) {
  }

  public record FairnessPoint(String cohort, double parity, int overrides) {
  }

  public record DemoSnapshot(
      boolean enabled,
      List<TimelineEvent> timeline,
      int currentStep
  ) {
  }

  public record TimelineEvent(
      String id,
      long timeOffsetMs,
      OffsetDateTime timestamp,
      String type,
      String title,
      String description,
      String severity,
      String caseId,
      String clientId,
      String routeHint
  ) {
  }

  public record ExplainabilityResponse(
      String caseId,
      DecisionLog decision
  ) {
  }

  public record CheckKycResponse(
      String status,
      String message,
      OffsetDateTime checkedAt
  ) {
  }

  public record CheckKybResponse(
      String status,
      String message,
      String entityName,
      boolean addressMatched,
      boolean taxIdMatched,
      String companyStatus,
      OffsetDateTime checkedAt
  ) {
  }
}
