import { buildScenarioState } from '@/mock-data/adapters';
import type { PlatformSliceCreator, SimulationSlice } from '@/store/types';

export const createSimulationSlice: PlatformSliceCreator<SimulationSlice> = (set, get) => ({
  timeline: buildScenarioState(0).timeline,
  mode: 'autoplay',
  autoplay: false,
  speedMultiplier: 1,
  currentStep: 0,
  setDemoMode: (mode) => set({ mode }),
  toggleAutoplay: () =>
    set((state) => ({
      autoplay: state.currentStep >= state.timeline.length ? false : !state.autoplay,
    })),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  syncScenario: (step) => {
    const current = get();
    const scenario = buildScenarioState(step);
    const nextSelectedCase =
      current.selectedCaseId && scenario.cases.some((record) => record.id === current.selectedCaseId)
        ? current.selectedCaseId
        : scenario.cases[0]?.id ?? null;

    set({
      currentStep: step,
      clients: scenario.clients,
      cases: scenario.cases,
      kpis: scenario.kpis,
      regionPerformance: scenario.regionPerformance,
      trendSeries: scenario.trendSeries,
      donutSlices: scenario.donutSlices,
      agents: scenario.agents,
      activityFeed: scenario.activityFeed,
      confidenceMatrix: scenario.confidenceMatrix,
      taskThroughput: scenario.taskThroughput,
      alerts: scenario.alerts,
      falsePositiveGauge: scenario.falsePositiveGauge,
      riskHistogram: scenario.riskHistogram,
      decisionLogs: scenario.decisionLogs,
      fairnessSeries: scenario.fairnessSeries,
      humanOverrideRate: scenario.humanOverrideRate,
      selectedCaseId: nextSelectedCase,
      focusedCaseId: nextSelectedCase,
      autoplay: step >= scenario.timeline.length ? false : current.autoplay,
    });
  },
  stepTimeline: () => {
    const current = get();
    if (current.currentStep >= current.timeline.length) {
      set({ autoplay: false });
      return;
    }

    current.syncScenario(current.currentStep + 1);
  },
  resetTimeline: () => {
    set({ autoplay: false });
    get().syncScenario(0);
  },
  applyTimelineEvent: (event) => {
    const current = get();
    const eventIndex = current.timeline.findIndex((item) => item.id === event.id);
    if (eventIndex === -1) {
      return;
    }

    current.syncScenario(eventIndex + 1);
  },
});
