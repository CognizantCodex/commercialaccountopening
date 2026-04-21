import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DemoControlBar } from '@/app/layout/DemoControlBar';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('DemoControlBar', () => {
  beforeEach(() => {
    resetStore();
  });

  it('drives the demo controls when the workspace is in demo mode', async () => {
    const user = userEvent.setup();
    const toggleAutoplay = vi.fn();
    const stepTimeline = vi.fn();
    const resetTimeline = vi.fn();
    const setSpeedMultiplier = vi.fn();
    const setDemoMode = vi.fn();
    const setDataSource = vi.fn();

    usePlatformStore.setState({
      dataSource: 'demo',
      autoplay: false,
      mode: 'interactive',
      currentStep: 3,
      toggleAutoplay,
      stepTimeline,
      resetTimeline,
      setSpeedMultiplier,
      setDemoMode,
      setDataSource,
    });

    renderWithProviders(<DemoControlBar />);

    await user.click(screen.getByRole('button', { name: /start autoplay/i }));
    await user.click(screen.getByRole('button', { name: /step/i }));
    await user.click(screen.getByRole('button', { name: /reset/i }));
    await user.click(screen.getByRole('button', { name: 'Live' }));
    await user.click(screen.getByRole('button', { name: 'Autoplay' }));
    await user.click(screen.getByRole('button', { name: '4x' }));

    expect(toggleAutoplay).toHaveBeenCalledOnce();
    expect(stepTimeline).toHaveBeenCalledOnce();
    expect(resetTimeline).toHaveBeenCalledOnce();
    expect(setDataSource).toHaveBeenCalledWith('live');
    expect(setDemoMode).toHaveBeenCalledWith('autoplay');
    expect(setSpeedMultiplier).toHaveBeenCalledWith(4);
    expect(screen.getByText(/Event 3 of/i)).toBeInTheDocument();
  });

  it('shows live-sync controls and errors when the workspace is in live mode', async () => {
    const user = userEvent.setup();
    const refreshPlatform = vi.fn().mockResolvedValue(undefined);

    usePlatformStore.setState({
      dataSource: 'live',
      hydrationStatus: 'ready',
      lastSyncAt: '2026-04-21T06:45:00Z',
      loadError: 'Snapshot drift detected.',
      refreshPlatform,
    });

    renderWithProviders(<DemoControlBar />);

    expect(screen.getByText(/Last sync/i)).toBeInTheDocument();
    expect(screen.getByText('Snapshot drift detected.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh live/i }));

    expect(refreshPlatform).toHaveBeenCalledOnce();
  });
});
