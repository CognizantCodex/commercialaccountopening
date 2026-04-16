package com.kycnorthstar.platform.modules.ownership;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ownership_party")
public class OwnershipPartyEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String role;

  @Enumerated(EnumType.STRING)
  @Column(name = "group_name", nullable = false)
  private OwnershipGroup groupName;

  public OwnershipPartyEntity() {
  }

  public OwnershipPartyEntity(String id, String caseId, String name, String role, OwnershipGroup groupName) {
    this.id = id;
    this.caseId = caseId;
    this.name = name;
    this.role = role;
    this.groupName = groupName;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getName() {
    return name;
  }

  public String getRole() {
    return role;
  }

  public OwnershipGroup getGroupName() {
    return groupName;
  }
}
