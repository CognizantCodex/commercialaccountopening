import { Command, Monitor, MoonStar, Search, SunMedium } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePlatformStore } from '@/store';
import { routeCatalog } from '@/services/selectors';
import type { DashboardRoute } from '@/types/platform';

export function TopBar({ currentRoute }: { currentRoute: DashboardRoute }) {
  const setCommandPaletteOpen = usePlatformStore((state) => state.setCommandPaletteOpen);
  const themeMode = usePlatformStore((state) => state.themeMode);
  const cycleTheme = usePlatformStore((state) => state.cycleTheme);

  const icon =
    themeMode === 'light' ? (
      <SunMedium className="h-4 w-4" />
    ) : themeMode === 'system' ? (
      <Monitor className="h-4 w-4" />
    ) : (
      <MoonStar className="h-4 w-4" />
    );

  return (
    <header className="cognizant-topbar sticky top-0 z-20 border-b border-[var(--border)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)] md:inline-flex">
              Cognizant KYC Fabric
            </span>
            <Badge variant="info">{routeCatalog[currentRoute].eyebrow}</Badge>
            <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
              Persona: {routeCatalog[currentRoute].persona}
            </span>
          </div>
          <h2 className="mt-2 truncate text-2xl font-semibold text-[var(--foreground)]">
            {routeCatalog[currentRoute].title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="hidden min-w-[180px] justify-between md:inline-flex"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <Search className="h-4 w-4" />
              Command palette
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Command className="h-3 w-3" />
              K
            </span>
          </Button>
          <Button variant="secondary" size="icon" onClick={cycleTheme} aria-label="Cycle theme">
            {icon}
          </Button>
        </div>
      </div>
    </header>
  );
}
