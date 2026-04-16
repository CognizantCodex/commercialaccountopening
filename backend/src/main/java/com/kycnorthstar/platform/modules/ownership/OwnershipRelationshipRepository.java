package com.kycnorthstar.platform.modules.ownership;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnershipRelationshipRepository extends JpaRepository<OwnershipRelationshipEntity, String> {

  List<OwnershipRelationshipEntity> findAllByCaseIdOrderByIdAsc(String caseId);
}
