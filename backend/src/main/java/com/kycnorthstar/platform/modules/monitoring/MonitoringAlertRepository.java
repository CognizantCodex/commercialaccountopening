package com.kycnorthstar.platform.modules.monitoring;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonitoringAlertRepository extends JpaRepository<MonitoringAlertEntity, String> {

  List<MonitoringAlertEntity> findAllByOrderByEventTimeDesc();
}
