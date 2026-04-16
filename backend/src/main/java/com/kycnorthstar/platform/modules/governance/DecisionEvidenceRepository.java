package com.kycnorthstar.platform.modules.governance;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DecisionEvidenceRepository extends JpaRepository<DecisionEvidenceEntity, String> {

  List<DecisionEvidenceEntity> findAllByDecisionIdOrderByIdAsc(String decisionId);
}
