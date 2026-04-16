package com.kycnorthstar.platform.modules.governance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "decision_record")
public class DecisionRecordEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String actor;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GovernanceDecision decision;

  @Column(nullable = false)
  private int confidence;

  @Lob
  @Column(name = "override_reason")
  private String overrideReason;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  public DecisionRecordEntity() {
  }

  public DecisionRecordEntity(
      String id,
      String caseId,
      String title,
      String actor,
      GovernanceDecision decision,
      int confidence,
      String overrideReason,
      OffsetDateTime createdAt
  ) {
    this.id = id;
    this.caseId = caseId;
    this.title = title;
    this.actor = actor;
    this.decision = decision;
    this.confidence = confidence;
    this.overrideReason = overrideReason;
    this.createdAt = createdAt;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getTitle() {
    return title;
  }

  public String getActor() {
    return actor;
  }

  public GovernanceDecision getDecision() {
    return decision;
  }

  public int getConfidence() {
    return confidence;
  }

  public String getOverrideReason() {
    return overrideReason;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
