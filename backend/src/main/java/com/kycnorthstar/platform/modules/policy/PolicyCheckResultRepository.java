package com.kycnorthstar.platform.modules.policy;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyCheckResultRepository extends JpaRepository<PolicyCheckResultEntity, String> {

  List<PolicyCheckResultEntity> findAllByCaseIdOrderByLabelAsc(String caseId);
}
