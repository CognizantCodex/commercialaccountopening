package com.kycnorthstar.platform.modules.evidence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "document_submission")
public class DocumentSubmissionEntity {

  @Id
  private String id;

  @Column(name = "case_id", nullable = false)
  private String caseId;

  @Column(nullable = false)
  private String type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private DocumentStatus status;

  @Column(nullable = false)
  private int completeness;

  @Column(name = "uploaded_at", nullable = false)
  private OffsetDateTime uploadedAt;

  @Lob
  @Column(name = "extracted_fields", nullable = false)
  private String extractedFields;

  public DocumentSubmissionEntity() {
  }

  public DocumentSubmissionEntity(
      String id,
      String caseId,
      String type,
      DocumentStatus status,
      int completeness,
      OffsetDateTime uploadedAt,
      String extractedFields
  ) {
    this.id = id;
    this.caseId = caseId;
    this.type = type;
    this.status = status;
    this.completeness = completeness;
    this.uploadedAt = uploadedAt;
    this.extractedFields = extractedFields;
  }

  public String getId() {
    return id;
  }

  public String getCaseId() {
    return caseId;
  }

  public String getType() {
    return type;
  }

  public DocumentStatus getStatus() {
    return status;
  }

  public void setStatus(DocumentStatus status) {
    this.status = status;
  }

  public int getCompleteness() {
    return completeness;
  }

  public void setCompleteness(int completeness) {
    this.completeness = completeness;
  }

  public OffsetDateTime getUploadedAt() {
    return uploadedAt;
  }

  public String getExtractedFields() {
    return extractedFields;
  }

  public void setExtractedFields(String extractedFields) {
    this.extractedFields = extractedFields;
  }
}
