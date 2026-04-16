package com.kycnorthstar.platform.modules.agents;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgentExecutionRepository extends JpaRepository<AgentExecutionEntity, String> {

  List<AgentExecutionEntity> findAllByOrderByNameAsc();
}
