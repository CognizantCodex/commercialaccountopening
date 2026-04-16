package com.kycnorthstar.platform.modules.monitoring;

import com.kycnorthstar.platform.shared.Severity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "monitoring_alert")
public class MonitoringAlertEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(name = "client_id", nullable = false)
  private String clientId;

  @Column(nullable = false)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Severity severity;

  @Column(nullable = false)
  private String region;

  @Column(nullable = false)
  private double latitude;

  @Column(nullable = false)
  private double longitude;

  @Column(name = "event_time", nullable = false)
  private OffsetDateTime eventTime;

  @Column(name = "false_positive_risk", nullable = false)
  private int falsePositiveRisk;

  @Lob
  @Column(nullable = false)
  private String description;

  public MonitoringAlertEntity() {
  }

  public MonitoringAlertEntity(
      String id,
      String caseId,
      String clientId,
      String title,
      Severity severity,
      String region,
      double latitude,
      double longitude,
      OffsetDateTime eventTime,
      int falsePositiveRisk,
      String description
  ) {
    this.id = id;
    this.caseId = caseId;
    this.clientId = clientId;
    this.title = title;
    this.severity = severity;
    this.region = region;
    this.latitude = latitude;
    this.longitude = longitude;
    this.eventTime = eventTime;
    this.falsePositiveRisk = falsePositiveRisk;
    this.description = description;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getClientId() {
    return clientId;
  }

  public String getTitle() {
    return title;
  }

  public Severity getSeverity() {
    return severity;
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

  public OffsetDateTime getEventTime() {
    return eventTime;
  }

  public int getFalsePositiveRisk() {
    return falsePositiveRisk;
  }

  public String getDescription() {
    return description;
  }
}
