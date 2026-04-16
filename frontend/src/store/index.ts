import { create } from 'zustand';
import { buildScenarioState } from '@/mock-data/adapters';
import { createAgentsSlice } from '@/store/agents';
import { createAppSlice } from '@/store/app';
import { createCasesSlice } from '@/store/cases';
import { createGovernanceSlice } from '@/store/governance';
import { createMetricsSlice } from '@/store/metrics';
import { createMonitoringSlice } from '@/store/monitoring';
import { createSimulationSlice } from '@/store/simulation';
import type { PlatformStore } from '@/store/types';

const initialScenario = buildScenarioState(0);

export const usePlatformStore = create<PlatformStore>()((...args) => ({
  ...createAppSlice(...args),
  ...createMetricsSlice(initialScenario)(...args),
  ...createAgentsSlice(initialScenario)(...args),
  ...createCasesSlice(initialScenario)(...args),
  ...createMonitoringSlice(initialScenario)(...args),
  ...createGovernanceSlice(initialScenario)(...args),
  ...createSimulationSlice(...args),
}));
