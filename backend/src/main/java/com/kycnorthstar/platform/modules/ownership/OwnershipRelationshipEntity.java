package com.kycnorthstar.platform.modules.ownership;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ownership_relationship")
public class OwnershipRelationshipEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(name = "source_id", nullable = false)
  private String sourceId;

  @Column(name = "target_id", nullable = false)
  private String targetId;

  @Column(name = "weight_value", nullable = false)
  private int weightValue;

  public OwnershipRelationshipEntity() {
  }

  public OwnershipRelationshipEntity(String id, String caseId, String sourceId, String targetId, int weightValue) {
    this.id = id;
    this.caseId = caseId;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.weightValue = weightValue;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getSourceId() {
    return sourceId;
  }

  public String getTargetId() {
    return targetId;
  }

  public int getWeightValue() {
    return weightValue;
  }
}
