package com.kycnorthstar.platform.modules.business;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "business_information")
public class BusinessInformationEntity {

  @Id
  private String id;

  @Column(name = "entity_name", nullable = false)
  private String entityName;

  @Column(nullable = false)
  private String address;

  @Column(name = "control_number", nullable = false)
  private String controlNumber;

  @Column(name = "company_status", nullable = false)
  private String companyStatus;

  public BusinessInformationEntity() {
  }

  public BusinessInformationEntity(
      String id,
      String entityName,
      String address,
      String controlNumber,
      String companyStatus
  ) {
    this.id = id;
    this.entityName = entityName;
    this.address = address;
    this.controlNumber = controlNumber;
    this.companyStatus = companyStatus;
  }

  public String getId() {
    return id;
  }

  public String getEntityName() {
    return entityName;
  }

  public String getAddress() {
    return address;
  }

  public String getControlNumber() {
    return controlNumber;
  }

  public String getCompanyStatus() {
    return companyStatus;
  }
}
