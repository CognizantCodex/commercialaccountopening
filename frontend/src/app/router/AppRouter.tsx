import { lazy, Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';

const ExecutiveView = lazy(() =>
  import('@/features/executive/ExecutiveView').then((module) => ({
    default: module.ExecutiveView,
  })),
);
const AgentsView = lazy(() =>
  import('@/features/agents/AgentsView').then((module) => ({
    default: module.AgentsView,
  })),
);
const CasesView = lazy(() =>
  import('@/features/cases/CasesView').then((module) => ({
    default: module.CasesView,
  })),
);
const MonitoringView = lazy(() =>
  import('@/features/monitoring/MonitoringView').then((module) => ({
    default: module.MonitoringView,
  })),
);
const GovernanceView = lazy(() =>
  import('@/features/governance/GovernanceView').then((module) => ({
    default: module.GovernanceView,
  })),
);

function RouteFallback() {
  return (
    <div className="grid gap-6">
      <LoadingSkeleton className="h-24 rounded-[1.5rem]" />
      <LoadingSkeleton className="h-[24rem] rounded-[1.5rem]" />
      <LoadingSkeleton className="h-[18rem] rounded-[1.5rem]" />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/executive" replace /> },
      {
        path: 'executive',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <ExecutiveView />
          </Suspense>
        ),
      },
      {
        path: 'agents',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <AgentsView />
          </Suspense>
        ),
      },
      {
        path: 'cases',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <CasesView />
          </Suspense>
        ),
      },
      {
        path: 'monitoring',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <MonitoringView />
          </Suspense>
        ),
      },
      {
        path: 'governance',
        element: (
          <Suspense fallback={<RouteFallback />}>
            <GovernanceView />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
