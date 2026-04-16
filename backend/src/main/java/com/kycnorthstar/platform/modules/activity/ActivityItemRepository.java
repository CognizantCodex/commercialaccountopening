package com.kycnorthstar.platform.modules.activity;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityItemRepository extends JpaRepository<ActivityItemEntity, String> {

  List<ActivityItemEntity> findAllByOrderByTimestampDesc();
}
