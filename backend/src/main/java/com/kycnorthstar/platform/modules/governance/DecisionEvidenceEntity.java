package com.kycnorthstar.platform.modules.governance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "decision_evidence")
public class DecisionEvidenceEntity {

  @Id
  private String id;

  @Column(name = "decision_id", nullable = false)
  private String decisionId;

  @Column(nullable = false)
  private String label;

  @Column(nullable = false)
  private String type;

  @Column(nullable = false)
  private int confidence;

  @Lob
  @Column(nullable = false)
  private String excerpt;

  public DecisionEvidenceEntity() {
  }

  public DecisionEvidenceEntity(String id, String decisionId, String label, String type, int confidence, String excerpt) {
    this.id = id;
    this.decisionId = decisionId;
    this.label = label;
    this.type = type;
    this.confidence = confidence;
    this.excerpt = excerpt;
  }

  public String getId() {
    return id;
  }

  public String getDecisionId() {
    return decisionId;
  }

  public String getLabel() {
    return label;
  }

  public String getType() {
    return type;
  }

  public int getConfidence() {
    return confidence;
  }

  public String getExcerpt() {
    return excerpt;
  }
}
