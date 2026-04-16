import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildScenarioState } from '@/mock-data/adapters';
import { platformApi } from '@/services/platform-api';
import { usePlatformStore } from '@/store';

describe('platform store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    usePlatformStore.getState().resetTimeline();
    usePlatformStore.setState({
      themeMode: 'dark',
      commandPaletteOpen: false,
      dataSource: 'demo',
      hydrationStatus: 'idle',
      loadError: null,
      lastSyncAt: null,
      activeMutation: null,
      autoplay: true,
    });
  });

  it('steps the scenario forward deterministically', () => {
    usePlatformStore.getState().stepTimeline();
    usePlatformStore.getState().stepTimeline();

    const state = usePlatformStore.getState();

    expect(state.currentStep).toBe(2);
    expect(state.cases.find((record) => record.id === 'case-aurora-001')?.stage).toBe('quality-check');
  });

  it('cycles theme modes in the expected order', () => {
    usePlatformStore.getState().cycleTheme();
    expect(usePlatformStore.getState().themeMode).toBe('light');

    usePlatformStore.getState().cycleTheme();
    expect(usePlatformStore.getState().themeMode).toBe('system');
  });

  it('hydrates the store from a live snapshot when live mode is active', async () => {
    const liveScenario = buildScenarioState(0);
    liveScenario.timeline = [];
    liveScenario.cases = liveScenario.cases.map((record, index) =>
      index === 0
        ? {
            ...record,
            id: 'case-live-001',
            caseName: 'Live Integration Case',
          }
        : record,
    );

    const fetchSnapshotSpy = vi.spyOn(platformApi, 'fetchSnapshot').mockResolvedValue(liveScenario);
    usePlatformStore.setState({ dataSource: 'live' });

    await usePlatformStore.getState().initializePlatform();

    const state = usePlatformStore.getState();

    expect(fetchSnapshotSpy).toHaveBeenCalledOnce();
    expect(state.hydrationStatus).toBe('ready');
    expect(state.cases[0]?.id).toBe('case-live-001');
    expect(state.selectedCaseId).toBe('case-live-001');
  });

  it('dispatches live workflow actions through the API and refreshes afterwards', async () => {
    const liveScenario = buildScenarioState(0);
    liveScenario.timeline = [];
    liveScenario.cases = [
      {
        ...liveScenario.cases[0],
        id: 'case-live-002',
        caseName: 'Live Mutation Case',
      },
    ];

    const runActionSpy = vi.spyOn(platformApi, 'runCaseWorkflowAction').mockResolvedValue(undefined);
    const fetchSnapshotSpy = vi.spyOn(platformApi, 'fetchSnapshot').mockResolvedValue(liveScenario);

    usePlatformStore.setState({
      dataSource: 'live',
      cases: liveScenario.cases,
      clients: liveScenario.clients,
      selectedCaseId: 'case-live-002',
      focusedCaseId: 'case-live-002',
      timeline: [],
      hydrationStatus: 'ready',
    });

    await usePlatformStore.getState().runCaseWorkflowAction('resolve', 'case-live-002');

    const state = usePlatformStore.getState();

    expect(runActionSpy).toHaveBeenCalledWith('resolve', 'case-live-002');
    expect(fetchSnapshotSpy).toHaveBeenCalledOnce();
    expect(state.activeMutation).toBeNull();
    expect(state.selectedCaseId).toBe('case-live-002');
  });

  it('keeps the demo autoplay running by looping back to the start', () => {
    const timelineLength = usePlatformStore.getState().timeline.length;

    usePlatformStore.setState({
      dataSource: 'demo',
      autoplay: true,
      currentStep: timelineLength,
    });

    usePlatformStore.getState().stepTimeline();

    const state = usePlatformStore.getState();

    expect(state.currentStep).toBe(0);
    expect(state.autoplay).toBe(true);
  });

  it('restarts demo mode in autoplay when switching back from live', () => {
    usePlatformStore.getState().setDataSource('live');
    usePlatformStore.getState().setDataSource('demo');

    const state = usePlatformStore.getState();

    expect(state.dataSource).toBe('demo');
    expect(state.autoplay).toBe(true);
    expect(state.hydrationStatus).toBe('idle');
  });

  it('includes an extended autoplay timeline with follow-on case activity', () => {
    const extendedScenario = buildScenarioState(9);
    const meridianCase = extendedScenario.cases.find((record) => record.id === 'case-meridian-003');

    expect(extendedScenario.timeline.length).toBeGreaterThan(10);
    expect(meridianCase?.status).toBe('resolved');
    expect(meridianCase?.stage).toBe('monitoring');
  });
});
