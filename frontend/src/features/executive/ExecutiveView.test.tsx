import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ExecutiveView } from '@/features/executive/ExecutiveView';
import { routeCatalog } from '@/services/selectors';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('ExecutiveView', () => {
  beforeEach(() => {
    resetStore();
    usePlatformStore.setState({ currentRoute: 'executive' });
  });

  it('renders executive metrics and supports drilling into a KPI route', async () => {
    const user = userEvent.setup();
    const metric = usePlatformStore.getState().kpis.find((item) => item.route);

    if (!metric) {
      throw new Error('Expected at least one KPI route in the demo state.');
    }

    navigateMock.mockReset();

    renderWithProviders(<ExecutiveView />);

    expect(screen.getByText('Regional straight-through onboarding momentum')).toBeInTheDocument();
    expect(screen.getByText('Scale the AI operating model')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: new RegExp(metric.label, 'i') }));

    expect(navigateMock).toHaveBeenCalledWith(routeCatalog[metric.route].path);
  });

  it('shows loading skeletons while the live snapshot is hydrating', () => {
    usePlatformStore.setState({
      dataSource: 'live',
      hydrationStatus: 'loading',
    });

    const { container } = renderWithProviders(<ExecutiveView />);

    expect(screen.queryByText('Regional straight-through onboarding momentum')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows a retry state when live hydration fails', async () => {
    const user = userEvent.setup();
    const refreshPlatform = vi.fn().mockResolvedValue(undefined);

    usePlatformStore.setState({
      dataSource: 'live',
      hydrationStatus: 'error',
      loadError: 'Snapshot request failed.',
      refreshPlatform,
    });

    renderWithProviders(<ExecutiveView />);

    expect(screen.getByText('Executive metrics are waiting for a clean live refresh')).toBeInTheDocument();
    expect(screen.getByText('Snapshot request failed.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /refresh live data/i }));

    expect(refreshPlatform).toHaveBeenCalledOnce();
  });
});
