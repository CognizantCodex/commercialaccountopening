import { Suspense } from 'react';
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import { ExecutiveView } from '@/features/executive/ExecutiveView';
import { AgentsView } from '@/features/agents/AgentsView';
import { CasesView } from '@/features/cases/CasesView';
import { MonitoringView } from '@/features/monitoring/MonitoringView';
import { GovernanceView } from '@/features/governance/GovernanceView';
import { LegacyAccountOpeningPage } from '@/features/application/LegacyAccountOpeningPage';

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
    element: (
      <Suspense fallback={<RouteFallback />}>
        <LegacyAccountOpeningPage />
      </Suspense>
    ),
  },
  {
    path: '/application',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/kyc-fabric',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/kyc-fabric/executive" replace /> },
      { path: 'executive', element: <ExecutiveView /> },
      { path: 'agents', element: <AgentsView /> },
      { path: 'cases', element: <CasesView /> },
      { path: 'monitoring', element: <MonitoringView /> },
      { path: 'governance', element: <GovernanceView /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});

export function AppRouter() {
  return <RouterProvider router={router} />;
}
