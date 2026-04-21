import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDemoEngine } from '@/services/demo-engine';
import { usePlatformStore } from '@/store';
import { renderWithProviders } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

function DemoEngineHarness() {
  useDemoEngine();
  return null;
}

describe('useDemoEngine', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  it('steps the timeline on an interval when demo autoplay is active', () => {
    const stepTimeline = vi.fn();

    usePlatformStore.setState({
      dataSource: 'demo',
      autoplay: true,
      speedMultiplier: 2,
      currentStep: 0,
      stepTimeline,
    });

    renderWithProviders(<DemoEngineHarness />);
    vi.advanceTimersByTime(500);

    expect(stepTimeline).toHaveBeenCalled();
  });

  it('does not schedule work when autoplay is disabled or the timeline is complete', () => {
    const stepTimeline = vi.fn();
    const timelineLength = usePlatformStore.getState().timeline.length;

    usePlatformStore.setState({
      dataSource: 'demo',
      autoplay: false,
      currentStep: timelineLength,
      stepTimeline,
    });

    renderWithProviders(<DemoEngineHarness />);
    vi.advanceTimersByTime(1000);

    expect(stepTimeline).not.toHaveBeenCalled();
  });
});
