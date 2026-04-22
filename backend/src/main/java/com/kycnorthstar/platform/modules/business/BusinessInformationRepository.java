package com.kycnorthstar.platform.modules.business;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessInformationRepository extends JpaRepository<BusinessInformationEntity, String> {

  Optional<BusinessInformationEntity> findFirstByEntityNameIgnoreCase(String entityName);
}
