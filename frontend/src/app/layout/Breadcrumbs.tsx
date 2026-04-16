import { ChevronRight, Home } from 'lucide-react';
import { usePlatformStore } from '@/store';
import { getSelectedCase, routeCatalog } from '@/services/selectors';

export function Breadcrumbs() {
  const currentRoute = usePlatformStore((state) => state.currentRoute);
  const state = usePlatformStore();
  const selectedCase = getSelectedCase(state);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      <Home className="h-4 w-4" />
      <ChevronRight className="h-4 w-4" />
      <span>{routeCatalog[currentRoute].title}</span>
      {(currentRoute === 'cases' || currentRoute === 'governance') && selectedCase && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="truncate text-[var(--foreground)]">{selectedCase.caseName}</span>
        </>
      )}
    </nav>
  );
}
