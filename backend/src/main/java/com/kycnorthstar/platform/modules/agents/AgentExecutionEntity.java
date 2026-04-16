package com.kycnorthstar.platform.modules.agents;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "agent_execution")
public class AgentExecutionEntity {

  @Id
  private String id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AgentStatus status;

  @Column(name = "latency_ms", nullable = false)
  private int latencyMs;

  @Column(name = "tasks_processed", nullable = false)
  private int tasksProcessed;

  @Column(name = "auto_share", nullable = false)
  private int autoShare;

  @Column(name = "manual_share", nullable = false)
  private int manualShare;

  @Lob
  @Column(name = "pulse_message", nullable = false)
  private String pulseMessage;

  public AgentExecutionEntity() {
  }

  public AgentExecutionEntity(
      String id,
      String name,
      String role,
      AgentStatus status,
      int latencyMs,
      int tasksProcessed,
      int autoShare,
      int manualShare,
      String pulseMessage
  ) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.status = status;
    this.latencyMs = latencyMs;
    this.tasksProcessed = tasksProcessed;
    this.autoShare = autoShare;
    this.manualShare = manualShare;
    this.pulseMessage = pulseMessage;
  }

  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public String getRole() {
    return role;
  }

  public AgentStatus getStatus() {
    return status;
  }

  public int getLatencyMs() {
    return latencyMs;
  }

  public int getTasksProcessed() {
    return tasksProcessed;
  }

  public int getAutoShare() {
    return autoShare;
  }

  public int getManualShare() {
    return manualShare;
  }

  public String getPulseMessage() {
    return pulseMessage;
  }
}
