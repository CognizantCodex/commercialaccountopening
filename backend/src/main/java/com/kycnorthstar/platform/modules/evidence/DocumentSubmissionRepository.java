package com.kycnorthstar.platform.modules.evidence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentSubmissionRepository extends JpaRepository<DocumentSubmissionEntity, String> {

  List<DocumentSubmissionEntity> findAllByCaseIdOrderByUploadedAtAsc(String caseId);
}
