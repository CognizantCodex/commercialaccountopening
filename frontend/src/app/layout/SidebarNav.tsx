import { Bot, Compass, Globe2, ShieldCheck, Waypoints } from 'lucide-react';
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

export function SidebarNav({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex h-full flex-col gap-6 p-4', compact && 'p-0')}>
      {!compact && (
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-muted)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted-foreground)]">
            KYC North Star
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            Intelligence Platform
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            From manual KYC to AI-driven, real-time, explainable compliance.
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
                  'group rounded-[1.5rem] border px-4 py-4 transition-all duration-200',
                  'border-[var(--border)] bg-[var(--surface-muted)] hover:-translate-y-0.5 hover:border-[color:rgba(0,201,177,0.35)]',
                  isActive &&
                    'border-[color:rgba(0,201,177,0.45)] bg-[linear-gradient(135deg,rgba(0,201,177,0.18),rgba(31,111,235,0.12))] shadow-[var(--shadow-soft)]',
                )
              }
            >
              <div className="flex items-start gap-3">
                <span className="rounded-xl bg-[color:rgba(0,201,177,0.14)] p-2 text-[var(--accent)]">
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
      </nav>
      {!compact && (
        <div className="mt-auto rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Demo posture
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
            Designed for boardroom storytelling, analyst drill-through, and explainable AI confidence.
          </p>
        </div>
      )}
    </div>
  );
}
