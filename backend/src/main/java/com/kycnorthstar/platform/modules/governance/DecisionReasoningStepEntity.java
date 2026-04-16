package com.kycnorthstar.platform.modules.governance;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "decision_reasoning_step")
public class DecisionReasoningStepEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "decision_id", nullable = false)
  private String decisionId;

  @Column(name = "step_order", nullable = false)
  private int stepOrder;

  @Lob
  @Column(nullable = false)
  private String content;

  public DecisionReasoningStepEntity() {
  }

  public DecisionReasoningStepEntity(String decisionId, int stepOrder, String content) {
    this.decisionId = decisionId;
    this.stepOrder = stepOrder;
    this.content = content;
  }

  public String getDecisionId() {
    return decisionId;
  }

  public int getStepOrder() {
    return stepOrder;
  }

  public String getContent() {
    return content;
  }
}
