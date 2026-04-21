import { ArrowLeft, Bot, Compass, Globe2, ShieldCheck, Waypoints } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { routeCatalog, routeOrder } from '@/services/selectors';

const routeIcons = {
  executive: Compass,
  agents: Bot,
  cases: Waypoints,
  monitoring: Globe2,
  governance: ShieldCheck,
};

const accountOpeningPath = '/';

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex h-full flex-col gap-6 p-4', compact && 'p-0')}>
      {!compact && (
        <div className="cognizant-brand-card rounded-[1.75rem] border border-[var(--border)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            Cognizant
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            KYC Fabric
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            A branded compliance command surface for executive insight, analyst execution, and explainable AI review.
          </p>
        </div>
      )}
      <nav
        aria-label="Primary navigation"
        className={cn(
          'grid gap-2',
          compact && 'grid-cols-2 gap-2 sm:grid-cols-3',
        )}
      >
        {routeOrder.map((route) => {
          const Icon = routeIcons[route];
          return (
            <NavLink
              key={route}
              to={routeCatalog[route].path}
              className={({ isActive }) =>
                cn(
                  'cognizant-nav-link group rounded-[1.5rem] border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5',
                  isActive &&
                    'cognizant-nav-link-active',
                )
              }
            >
              <div className="flex items-start gap-3">
                <span className="cognizant-nav-icon rounded-xl p-2 text-[var(--accent)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {routeCatalog[route].title}
                  </div>
                  {!compact && (
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {routeCatalog[route].persona}
                    </p>
                  )}
                </div>
              </div>
            </NavLink>
          );
        })}
        <NavLink
          to={accountOpeningPath}
          className={cn(
            'cognizant-nav-link group rounded-[1.5rem] border px-4 py-4 transition-all duration-200 hover:-translate-y-0.5',
            compact
              ? 'border-[var(--border)] bg-[var(--surface-muted)]'
              : 'border-[var(--border)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)]',
          )}
        >
          <div className="flex items-start gap-3">
            <span className="cognizant-nav-icon rounded-xl p-2 text-[var(--accent)]">
              <ArrowLeft className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--foreground)]">
                Corporate Account Opening Application
              </div>
              {!compact && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Return to the intake form workspace
                </p>
              )}
            </div>
          </div>
        </NavLink>
      </nav>
      {!compact && (
        <div className="mt-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Cognizant posture
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Tuned for trusted onboarding decisions, clear operating signals, and a premium client-ready narrative.
          </p>
        </div>
      )}
    </div>
  );
}
