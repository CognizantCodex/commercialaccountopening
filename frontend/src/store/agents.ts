import type { ScenarioState } from '@/mock-data/adapters';
import type { AgentsSlice, PlatformSliceCreator } from '@/store/types';

export function createAgentsSlice(initialScenario: ScenarioState): PlatformSliceCreator<AgentsSlice> {
  return () => ({
    agents: initialScenario.agents,
    activityFeed: initialScenario.activityFeed,
    confidenceMatrix: initialScenario.confidenceMatrix,
    taskThroughput: initialScenario.taskThroughput,
  });
}
