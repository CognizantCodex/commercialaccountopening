import { buildScenarioState } from '@/mock-data/adapters';
import { persistDataSource, platformApi, resolveInitialDataSource } from '@/services/platform-api';
import { createScenarioPatch, findWorkflowEvent } from '@/store/scenario';
import type { IntegrationSlice, PlatformSliceCreator } from '@/store/types';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to sync platform data.';
}

export const createIntegrationSlice: PlatformSliceCreator<IntegrationSlice> = (set, get) => ({
  dataSource: resolveInitialDataSource(),
  hydrationStatus: 'idle',
  loadError: null,
  lastSyncAt: null,
  activeMutation: null,
  initializePlatform: async () => {
    const state = get();

    if (state.hydrationStatus === 'loading') {
      return;
    }

    if (state.dataSource === 'demo') {
      const scenario = buildScenarioState(0);
      set((current) => ({
        hydrationStatus: 'ready',
        loadError: null,
        lastSyncAt: null,
        activeMutation: null,
        ...createScenarioPatch(scenario, current, {
          currentStep: 0,
          autoplay: true,
        }),
      }));
      return;
    }

    set({
      hydrationStatus: 'loading',
      loadError: null,
    });

    try {
      const scenario = await platformApi.fetchSnapshot();
      set((current) => ({
        hydrationStatus: 'ready',
        loadError: null,
        lastSyncAt: new Date().toISOString(),
        ...createScenarioPatch(scenario, current, {
          currentStep: scenario.timeline.length,
          autoplay: false,
        }),
      }));
    } catch (error) {
      set({
        hydrationStatus: 'error',
        loadError: toErrorMessage(error),
      });
    }
  },
  refreshPlatform: async () => {
    await get().initializePlatform();
  },
  setDataSource: (mode) => {
    persistDataSource(mode);
    set({
      dataSource: mode,
      hydrationStatus: 'idle',
      loadError: null,
      lastSyncAt: mode === 'demo' ? null : get().lastSyncAt,
      autoplay: mode === 'demo',
    });
  },
  runCaseWorkflowAction: async (action, caseId) => {
    const state = get();

    if (state.dataSource === 'demo') {
      state.selectCase(caseId);
      const event = findWorkflowEvent(state.timeline, action, caseId);
      if (event) {
        state.applyTimelineEvent(event);
      }
      return;
    }

    set({
      activeMutation: {
        action,
        caseId,
      },
      loadError: null,
    });

    try {
      await platformApi.runCaseWorkflowAction(action, caseId);
      get().selectCase(caseId);
      await get().refreshPlatform();
    } catch (error) {
      set({
        hydrationStatus: 'error',
        loadError: toErrorMessage(error),
      });
      throw error;
    } finally {
      set({
        activeMutation: null,
      });
    }
  },
});
