import type { ScenarioState } from '@/mock-data/adapters';
import type { GovernanceSlice, PlatformSliceCreator } from '@/store/types';

export function createGovernanceSlice(
  initialScenario: ScenarioState,
): PlatformSliceCreator<GovernanceSlice> {
  return () => ({
    decisionLogs: initialScenario.decisionLogs,
    fairnessSeries: initialScenario.fairnessSeries,
    humanOverrideRate: initialScenario.humanOverrideRate,
  });
}
