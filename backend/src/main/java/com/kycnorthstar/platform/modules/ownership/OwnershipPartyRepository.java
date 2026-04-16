package com.kycnorthstar.platform.modules.ownership;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnershipPartyRepository extends JpaRepository<OwnershipPartyEntity, String> {

  List<OwnershipPartyEntity> findAllByCaseIdOrderByNameAsc(String caseId);
}
