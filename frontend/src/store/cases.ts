import type { ScenarioState } from '@/mock-data/adapters';
import type { CasesSlice, PlatformSliceCreator } from '@/store/types';

export function createCasesSlice(initialScenario: ScenarioState): PlatformSliceCreator<CasesSlice> {
  return (set) => ({
    clients: initialScenario.clients,
    cases: initialScenario.cases,
    selectedCaseId: initialScenario.cases[0]?.id ?? null,
    selectCase: (caseId) => set({ selectedCaseId: caseId, focusedCaseId: caseId }),
  });
}
