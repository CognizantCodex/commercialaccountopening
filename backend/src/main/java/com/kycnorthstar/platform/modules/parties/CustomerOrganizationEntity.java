package com.kycnorthstar.platform.modules.parties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customer_organization")
public class CustomerOrganizationEntity {

  @Id
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String segment;

  @Column(nullable = false)
  private String headquarters;

  @Column(nullable = false)
  private String region;

  @Column(nullable = false)
  private double latitude;

  @Column(nullable = false)
  private double longitude;

  @Column(nullable = false)
  private String sector;

  @Column(name = "annual_revenue_usd", nullable = false)
  private long annualRevenueUsd;

  public CustomerOrganizationEntity() {
  }

  public CustomerOrganizationEntity(
      String id,
      String name,
      String segment,
      String headquarters,
      String region,
      double latitude,
      double longitude,
      String sector,
      long annualRevenueUsd
  ) {
    this.id = id;
    this.name = name;
    this.segment = segment;
    this.headquarters = headquarters;
    this.region = region;
    this.latitude = latitude;
    this.longitude = longitude;
    this.sector = sector;
    this.annualRevenueUsd = annualRevenueUsd;
  }

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getSegment() {
    return segment;
  }

  public String getHeadquarters() {
    return headquarters;
  }

  public String getRegion() {
    return region;
  }

  public double getLatitude() {
    return latitude;
  }

  public double getLongitude() {
    return longitude;
  }

  public String getSector() {
    return sector;
  }

  public long getAnnualRevenueUsd() {
    return annualRevenueUsd;
  }
}
