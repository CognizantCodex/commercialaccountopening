package com.kycnorthstar.platform.modules.activity;

import com.kycnorthstar.platform.shared.DashboardRoute;
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
@Table(name = "activity_item")
public class ActivityItemEntity {

  @Id
  private String id;

  @Column(nullable = false)
  private String title;

  @Lob
  @Column(nullable = false)
  private String description;

  @Column(nullable = false)
  private OffsetDateTime timestamp;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Severity severity;

  @Enumerated(EnumType.STRING)
  @Column(name = "route_hint", nullable = false)
  private DashboardRoute routeHint;

  public ActivityItemEntity() {
  }

  public ActivityItemEntity(
      String id,
      String title,
      String description,
      OffsetDateTime timestamp,
      Severity severity,
      DashboardRoute routeHint
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.timestamp = timestamp;
    this.severity = severity;
    this.routeHint = routeHint;
  }

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getDescription() {
    return description;
  }

  public OffsetDateTime getTimestamp() {
    return timestamp;
  }

  public Severity getSeverity() {
    return severity;
  }

  public DashboardRoute getRouteHint() {
    return routeHint;
  }
}
