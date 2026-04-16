package com.kycnorthstar.platform.modules.policy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "policy_check_result")
public class PolicyCheckResultEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(nullable = false)
  private String label;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PolicyCheckStatus status;

  @Lob
  @Column(nullable = false)
  private String rationale;

  public PolicyCheckResultEntity() {
  }

  public PolicyCheckResultEntity(String id, String caseId, String label, PolicyCheckStatus status, String rationale) {
    this.id = id;
    this.caseId = caseId;
    this.label = label;
    this.status = status;
    this.rationale = rationale;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getLabel() {
    return label;
  }

  public PolicyCheckStatus getStatus() {
    return status;
  }

  public void setStatus(PolicyCheckStatus status) {
    this.status = status;
  }

  public String getRationale() {
    return rationale;
  }

  public void setRationale(String rationale) {
    this.rationale = rationale;
  }
}
