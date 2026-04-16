package com.kycnorthstar.platform.modules.cases;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "compliance_case")
public class ComplianceCaseEntity {

  @Id
  private String id;

  @Column(name = "client_id", nullable = false)
  private String clientId;

  @Column(name = "case_name", nullable = false)
  private String caseName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CasePriority priority;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CaseStage stage;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private CaseStatus status;

  @Column(nullable = false)
  private String jurisdiction;

  @Column(nullable = false)
  private String region;

  @Column(name = "risk_score", nullable = false)
  private int riskScore;

  @Column(name = "stp_eligible", nullable = false)
  private boolean stpEligible;

  @Column(name = "first_time_right", nullable = false)
  private boolean firstTimeRight;

  @Column(name = "onboarding_hours", nullable = false)
  private double onboardingHours;

  @Column(name = "assigned_to", nullable = false)
  private String assignedTo;

  @Column(nullable = false)
  private int completeness;

  @Lob
  @Column(nullable = false)
  private String narrative;

  @Lob
  @Column(name = "next_best_action", nullable = false)
  private String nextBestAction;

  public ComplianceCaseEntity() {
  }

  public ComplianceCaseEntity(
      String id,
      String clientId,
      String caseName,
      CasePriority priority,
      CaseStage stage,
      CaseStatus status,
      String jurisdiction,
      String region,
      int riskScore,
      boolean stpEligible,
      boolean firstTimeRight,
      double onboardingHours,
      String assignedTo,
      int completeness,
      String narrative,
      String nextBestAction
  ) {
    this.id = id;
    this.clientId = clientId;
    this.caseName = caseName;
    this.priority = priority;
    this.stage = stage;
    this.status = status;
    this.jurisdiction = jurisdiction;
    this.region = region;
    this.riskScore = riskScore;
    this.stpEligible = stpEligible;
    this.firstTimeRight = firstTimeRight;
    this.onboardingHours = onboardingHours;
    this.assignedTo = assignedTo;
    this.completeness = completeness;
    this.narrative = narrative;
    this.nextBestAction = nextBestAction;
  }

  public String getId() {
    return id;
  }

  public String getClientId() {
    return clientId;
  }

  public String getCaseName() {
    return caseName;
  }

  public CasePriority getPriority() {
    return priority;
  }

  public CaseStage getStage() {
    return stage;
  }

  public void setStage(CaseStage stage) {
    this.stage = stage;
  }

  public CaseStatus getStatus() {
    return status;
  }

  public void setStatus(CaseStatus status) {
    this.status = status;
  }

  public String getJurisdiction() {
    return jurisdiction;
  }

  public String getRegion() {
    return region;
  }

  public int getRiskScore() {
    return riskScore;
  }

  public void setRiskScore(int riskScore) {
    this.riskScore = riskScore;
  }

  public boolean isStpEligible() {
    return stpEligible;
  }

  public void setStpEligible(boolean stpEligible) {
    this.stpEligible = stpEligible;
  }

  public boolean isFirstTimeRight() {
    return firstTimeRight;
  }

  public void setFirstTimeRight(boolean firstTimeRight) {
    this.firstTimeRight = firstTimeRight;
  }

  public double getOnboardingHours() {
    return onboardingHours;
  }

  public void setOnboardingHours(double onboardingHours) {
    this.onboardingHours = onboardingHours;
  }

  public String getAssignedTo() {
    return assignedTo;
  }

  public int getCompleteness() {
    return completeness;
  }

  public void setCompleteness(int completeness) {
    this.completeness = completeness;
  }

  public String getNarrative() {
    return narrative;
  }

  public void setNarrative(String narrative) {
    this.narrative = narrative;
  }

  public String getNextBestAction() {
    return nextBestAction;
  }

  public void setNextBestAction(String nextBestAction) {
    this.nextBestAction = nextBestAction;
  }
}
