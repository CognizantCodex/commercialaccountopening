import { beforeEach, describe, expect, it } from 'vitest';
import { usePlatformStore } from '@/store';

describe('platform store', () => {
  beforeEach(() => {
    usePlatformStore.getState().resetTimeline();
    usePlatformStore.setState({ themeMode: 'dark', commandPaletteOpen: false });
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
});
