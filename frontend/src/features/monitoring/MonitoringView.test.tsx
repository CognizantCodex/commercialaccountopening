import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MonitoringView } from '@/features/monitoring/MonitoringView';
import { renderWithProviders, screen } from '@/test/test-utils';
import { usePlatformStore } from '@/store';

describe('MonitoringView', () => {
  beforeEach(() => {
    usePlatformStore.getState().resetTimeline();
    usePlatformStore.setState({
      commandPaletteOpen: false,
      currentRoute: 'executive',
      dataSource: 'demo',
      focusedCaseId: null,
      focusedRegion: null,
      themeMode: 'dark',
    });
  });

  it('renders the monitoring dashboard without triggering a nested update loop', () => {
    expect(() =>
      renderWithProviders(
        <MemoryRouter>
          <MonitoringView />
        </MemoryRouter>,
      ),
    ).not.toThrow();

    expect(
      screen.getByRole('heading', { name: 'Continuous KYC pulse map' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Monitoring event stream')).toBeInTheDocument();
    expect(screen.getByText('Platform initialized')).toBeInTheDocument();
  });
});
