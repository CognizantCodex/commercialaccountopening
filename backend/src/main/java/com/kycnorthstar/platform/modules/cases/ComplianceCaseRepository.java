package com.kycnorthstar.platform.modules.cases;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplianceCaseRepository extends JpaRepository<ComplianceCaseEntity, String> {

  List<ComplianceCaseEntity> findAllByOrderByCaseNameAsc();
}
