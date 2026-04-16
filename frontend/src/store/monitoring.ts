import type { ScenarioState } from '@/mock-data/adapters';
import type { MonitoringSlice, PlatformSliceCreator } from '@/store/types';

export function createMonitoringSlice(
  initialScenario: ScenarioState,
): PlatformSliceCreator<MonitoringSlice> {
  return () => ({
    alerts: initialScenario.alerts,
    falsePositiveGauge: initialScenario.falsePositiveGauge,
    riskHistogram: initialScenario.riskHistogram,
  });
}
