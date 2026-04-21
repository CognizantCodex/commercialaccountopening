import { buildScenarioState } from '@/mock-data/adapters';
import { adaptPlatformSnapshot, type PlatformSnapshotDto } from '@/services/platform-adapter';
import { persistDataSource, platformApi, resolveInitialDataSource } from '@/services/platform-api';
import { createScenarioPatch, findWorkflowEvent } from '@/store/scenario';
import type { IntegrationSlice, PlatformSliceCreator } from '@/store/types';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to sync platform data.';
}

function mergeById<T extends { id: string }>(baseItems: T[], appendedItems: T[]) {
  const seen = new Set();
  return [...appendedItems, ...baseItems].filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function mergeAndSortByTimestamp<T extends { id: string }>(
  baseItems: T[],
  appendedItems: T[],
  getTimestamp: (item: T) => string,
  descending = true,
) {
  return mergeById(baseItems, appendedItems).sort((left, right) => {
    const leftTime = Date.parse(getTimestamp(left));
    const rightTime = Date.parse(getTimestamp(right));
    return descending ? rightTime - leftTime : leftTime - rightTime;
  });
}

function mergeScenarioWithAccountOpeningSnapshot(
  scenario: ScenarioState,
  accountOpeningSnapshot: PlatformSnapshotDto,
) {
  const mergedSnapshot: PlatformSnapshotDto = {
    clients: mergeById(scenario.clients, accountOpeningSnapshot.clients ?? []),
    cases: mergeById(scenario.cases, accountOpeningSnapshot.cases ?? []),
    timeline: mergeAndSortByTimestamp(
      scenario.timeline,
      accountOpeningSnapshot.timeline ?? [],
      (event) => event.timestamp,
      false,
    ),
    agents: scenario.agents,
    confidenceMatrix: scenario.confidenceMatrix,
    taskThroughput: scenario.taskThroughput,
    activityFeed: mergeAndSortByTimestamp(
      scenario.activityFeed,
      accountOpeningSnapshot.activityFeed ?? [],
      (item) => item.timestamp,
    ),
    alerts: mergeAndSortByTimestamp(
      scenario.alerts,
      accountOpeningSnapshot.alerts ?? [],
      (item) => item.eventTime,
    ),
    decisionLogs: mergeAndSortByTimestamp(
      scenario.decisionLogs,
      accountOpeningSnapshot.decisionLogs ?? [],
      (item) => item.createdAt,
    ),
  };

  return adaptPlatformSnapshot(mergedSnapshot);
}

async function hydrateScenarioWithAccountOpeningCases(baseScenario: ScenarioState) {
  try {
    const accountOpeningSnapshot = await platformApi.fetchAccountOpeningSnapshot();
    return mergeScenarioWithAccountOpeningSnapshot(baseScenario, accountOpeningSnapshot);
  } catch {
    return baseScenario;
  }
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
      const scenario = await hydrateScenarioWithAccountOpeningCases(buildScenarioState(0));
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
      const scenario = await hydrateScenarioWithAccountOpeningCases(
        await platformApi.fetchSnapshot(),
      );
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
