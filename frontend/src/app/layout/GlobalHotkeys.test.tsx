import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { GlobalHotkeys } from '@/app/layout/GlobalHotkeys';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe('GlobalHotkeys', () => {
  beforeEach(() => {
    resetStore();
    usePlatformStore.setState({
      setCommandPaletteOpen: vi.fn(),
      toggleAutoplay: vi.fn(),
      stepTimeline: vi.fn(),
      cycleTheme: vi.fn(),
    });
  });

  it('opens the palette, navigates routes, and dispatches playback hotkeys', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/kyc-fabric/executive']}>
        <GlobalHotkeys />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: ' ' });
    fireEvent.keyDown(window, { key: '.' });
    fireEvent.keyDown(window, { key: 'L', shiftKey: true });
    fireEvent.keyDown(window, { key: '2' });

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/kyc-fabric/agents');
    });

    expect(usePlatformStore.getState().setCommandPaletteOpen).toHaveBeenNthCalledWith(1, true);
    expect(usePlatformStore.getState().setCommandPaletteOpen).toHaveBeenNthCalledWith(2, false);
    expect(usePlatformStore.getState().toggleAutoplay).toHaveBeenCalledOnce();
    expect(usePlatformStore.getState().stepTimeline).toHaveBeenCalledOnce();
    expect(usePlatformStore.getState().cycleTheme).toHaveBeenCalledOnce();
  });

  it('ignores route shortcuts while the user is typing into an input', () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/kyc-fabric/executive']}>
        <input aria-label="typing target" />
        <GlobalHotkeys />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'typing target' }), { key: '3' });

    expect(screen.getByTestId('location')).toHaveTextContent('/kyc-fabric/executive');
  });
});
