import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ExecutiveView } from '@/features/executive/ExecutiveView';
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

    expect(navigateMock).toHaveBeenCalledWith(`/${metric.route}`);
  });
});
