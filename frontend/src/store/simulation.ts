import { buildScenarioState } from '@/mock-data/adapters';
import { createScenarioPatch } from '@/store/scenario';
import type { PlatformSliceCreator, SimulationSlice } from '@/store/types';

export const createSimulationSlice: PlatformSliceCreator<SimulationSlice> = (set, get) => ({
  timeline: buildScenarioState(0).timeline,
  mode: 'autoplay',
  autoplay: true,
  speedMultiplier: 1,
  currentStep: 0,
  setDemoMode: (mode) => set({ mode }),
  toggleAutoplay: () =>
    set((state) => ({ autoplay: !state.autoplay })),
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),
  syncScenario: (step) => {
    const current = get();
    const scenario = buildScenarioState(step);

    set({
      ...createScenarioPatch(scenario, current, {
        currentStep: step,
        autoplay: current.autoplay,
      }),
    });
  },
  stepTimeline: () => {
    const current = get();
    if (current.currentStep >= current.timeline.length) {
      current.syncScenario(0);
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
