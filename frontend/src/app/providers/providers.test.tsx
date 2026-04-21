import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/app/providers/AppProviders';
import { PlatformEffects } from '@/app/providers/PlatformEffects';
import { ThemeSynchronizer } from '@/app/providers/ThemeSynchronizer';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('providers', () => {
  beforeEach(() => {
    resetStore();
  });

  it('applies the selected theme to the document shell', async () => {
    usePlatformStore.setState({ themeMode: 'light' });

    renderWithProviders(<ThemeSynchronizer />);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('light');
    });

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('kyc-theme')).toBe('light');
  });

  it('initializes platform effects when the provider mounts', async () => {
    const initializePlatform = vi.fn().mockResolvedValue(undefined);
    usePlatformStore.setState({ initializePlatform, dataSource: 'demo' });

    renderWithProviders(<PlatformEffects />);

    await waitFor(() => {
      expect(initializePlatform).toHaveBeenCalledOnce();
    });
  });

  it('renders children through the provider boundary', () => {
    renderWithProviders(
      <AppProviders>
        <div>Provider child</div>
      </AppProviders>,
    );

    expect(screen.getByText('Provider child')).toBeInTheDocument();
  });
});
