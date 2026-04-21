import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/app/layout/Breadcrumbs';
import { CommandPalette } from '@/app/layout/CommandPalette';
import { DecisionBrief } from '@/app/layout/DecisionBrief';
import { DemoControlBar } from '@/app/layout/DemoControlBar';
import { GlobalHotkeys } from '@/app/layout/GlobalHotkeys';
import { KycFabricFooter } from '@/app/layout/KycFabricFooter';
import { SidebarNav } from '@/app/layout/SidebarNav';
import { TopBar } from '@/app/layout/TopBar';
import { RouteAnnouncer } from '@/components/feedback/RouteAnnouncer';
import { usePlatformStore } from '@/store';
import { routeCatalog, routeOrder } from '@/services/selectors';

function getRouteFromPath(pathname: string) {
  const route = pathname.split('/').filter(Boolean).at(-1) ?? 'executive';
  return routeOrder.includes(route as (typeof routeOrder)[number])
    ? (route as (typeof routeOrder)[number])
    : 'executive';
}

export function AppShell() {
  const location = useLocation();
  const currentRoute = getRouteFromPath(location.pathname);
  const navigateToView = usePlatformStore((state) => state.navigateToView);

  useEffect(() => {
    navigateToView(currentRoute);
    document.title = `${routeCatalog[currentRoute].title} | Cognizant KYC Fabric`;
  }, [currentRoute, navigateToView]);

  return (
    <div className="cognizant-shell flex min-h-screen flex-col lg:flex-row">
      <GlobalHotkeys />
      <RouteAnnouncer />
      <CommandPalette />
      <aside className="cognizant-sidebar hidden border-r border-[var(--border)] lg:block lg:w-80 lg:shrink-0">
        <SidebarNav />
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar currentRoute={currentRoute} />
        <div className="border-b border-[var(--border)] px-4 py-3 lg:hidden">
          <SidebarNav compact />
        </div>
        <DemoControlBar />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6">
            <Breadcrumbs currentRoute={currentRoute} />
            <DecisionBrief route={currentRoute} />
            <Outlet />
          </div>
        </main>
        <div className="px-4 pb-6 sm:px-6 lg:px-8">
          <KycFabricFooter />
        </div>
      </div>
    </div>
  );
}
