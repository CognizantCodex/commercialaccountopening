package com.kycnorthstar.platform.modules.governance;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DecisionRecordRepository extends JpaRepository<DecisionRecordEntity, String> {

  List<DecisionRecordEntity> findAllByOrderByCreatedAtDesc();

  List<DecisionRecordEntity> findAllByCaseIdOrderByCreatedAtDesc(String caseId);
}
