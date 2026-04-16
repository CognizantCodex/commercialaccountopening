package com.kycnorthstar.platform.modules.governance;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DecisionReasoningStepRepository extends JpaRepository<DecisionReasoningStepEntity, Long> {

  List<DecisionReasoningStepEntity> findAllByDecisionIdOrderByStepOrderAsc(String decisionId);
}
