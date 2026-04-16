import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { usePlatformStore } from '@/store';
import { routeCatalog, routeOrder } from '@/services/selectors';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  action: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const open = usePlatformStore((state) => state.commandPaletteOpen);
  const setOpen = usePlatformStore((state) => state.setCommandPaletteOpen);
  const toggleAutoplay = usePlatformStore((state) => state.toggleAutoplay);
  const resetTimeline = usePlatformStore((state) => state.resetTimeline);
  const [query, setQuery] = useState('');

  const commands = useMemo<CommandItem[]>(
    () => [
      ...routeOrder.map((route) => ({
        id: route,
        label: routeCatalog[route].title,
        description: `Jump to ${routeCatalog[route].persona} view`,
        action: () => navigate(routeCatalog[route].path),
      })),
      {
        id: 'autoplay',
        label: 'Toggle autoplay',
        description: 'Start or pause the timeline-driven demo sequence',
        action: () => toggleAutoplay(),
      },
      {
        id: 'reset',
        label: 'Reset demo state',
        description: 'Return the platform to the opening narrative beat',
        action: () => resetTimeline(),
      },
    ],
    [navigate, resetTimeline, toggleAutoplay],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const filtered = commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--overlay)] px-4 py-16 backdrop-blur-sm">
      <div className="w-full max-w-2xl">
        <Card className="p-3">
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              autoFocus
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              placeholder="Jump to a view or demo action..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="mt-3 grid gap-2">
            {filtered.map((command) => (
              <button
                key={command.id}
                type="button"
                className="rounded-[1.25rem] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                onClick={() => {
                  command.action();
                  setOpen(false);
                }}
              >
                <div className="font-medium text-[var(--foreground)]">{command.label}</div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {command.description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
