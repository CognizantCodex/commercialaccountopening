import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';

const createBrowserRouterMock = vi.fn((routes: unknown, options: unknown) => ({
  routes,
  options,
}));
const routerProviderMock = vi.fn(({ router }: { router: { routes: Array<{ path?: string; children?: Array<{ path?: string }> }> } }) => (
  <div>
    Router stub
    <span data-testid="route-count">{router.routes[2]?.children?.length ?? 0}</span>
  </div>
));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    createBrowserRouter: createBrowserRouterMock,
    RouterProvider: routerProviderMock,
  };
});

vi.mock('@/app/layout/AppShell', () => ({
  AppShell: () => <div>Shell</div>,
}));

vi.mock('@/features/executive/ExecutiveView', () => ({
  ExecutiveView: () => <div>Executive route</div>,
}));

vi.mock('@/features/agents/AgentsView', () => ({
  AgentsView: () => <div>Agents route</div>,
}));

vi.mock('@/features/cases/CasesView', () => ({
  CasesView: () => <div>Cases route</div>,
}));

vi.mock('@/features/monitoring/MonitoringView', () => ({
  MonitoringView: () => <div>Monitoring route</div>,
}));

vi.mock('@/features/governance/GovernanceView', () => ({
  GovernanceView: () => <div>Governance route</div>,
}));

vi.mock('@/features/application/LegacyAccountOpeningPage', () => ({
  LegacyAccountOpeningPage: () => <div>Legacy application route</div>,
}));

describe('AppRouter', () => {
  beforeEach(() => {
    vi.resetModules();
    createBrowserRouterMock.mockClear();
    routerProviderMock.mockClear();
  });

  it('builds the dashboard route tree and hands it to RouterProvider', async () => {
    const { AppRouter } = await import('@/app/router/AppRouter');

    renderWithProviders(<AppRouter />);

    const [routes, options] = createBrowserRouterMock.mock.calls[0] ?? [];
    const childRoutes = routes?.[2]?.children ?? [];
    const indexRoute = childRoutes.find((route: { index?: boolean }) => route.index);

    expect(options).toMatchObject({ basename: expect.any(String) });
    expect(routes?.[0]?.path).toBe('/');
    expect(routes?.[1]?.path).toBe('/application');
    expect(routes?.[2]?.path).toBe('/kyc-fabric');
    expect(childRoutes).toHaveLength(6);
    expect(indexRoute?.index).toBe(true);
    expect(indexRoute?.element?.props).toMatchObject({ to: '/kyc-fabric/executive', replace: true });
    expect(childRoutes.map((route: { path?: string }) => route.path ?? 'index')).toEqual([
      'index',
      'executive',
      'agents',
      'cases',
      'monitoring',
      'governance',
    ]);
    expect(screen.getByText('Router stub')).toBeInTheDocument();
    expect(screen.getByTestId('route-count')).toHaveTextContent('6');
  });
});
