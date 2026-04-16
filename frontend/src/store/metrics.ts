import type { ScenarioState } from '@/mock-data/adapters';
import type { MetricsSlice, PlatformSliceCreator } from '@/store/types';

export function createMetricsSlice(initialScenario: ScenarioState): PlatformSliceCreator<MetricsSlice> {
  return () => ({
    kpis: initialScenario.kpis,
    regionPerformance: initialScenario.regionPerformance,
    trendSeries: initialScenario.trendSeries,
    donutSlices: initialScenario.donutSlices,
  });
}
