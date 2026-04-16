import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  const [selectedIndex, setSelectedIndex] = useState(0);

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
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;

    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [open]);

  const filtered = commands.filter((command) =>
    command.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setSelectedIndex((currentIndex) => {
      if (filtered.length === 0) {
        return 0;
      }

      return Math.min(currentIndex, filtered.length - 1);
    });
  }, [filtered.length]);

  if (!open) {
    return null;
  }

  function activateCommand(index: number) {
    const command = filtered[index];

    if (!command) {
      return;
    }

    command.action();
    setOpen(false);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (filtered.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((currentIndex) => (currentIndex + 1) % filtered.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((currentIndex) => (currentIndex - 1 + filtered.length) % filtered.length);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setSelectedIndex(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setSelectedIndex(filtered.length - 1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      activateCommand(selectedIndex);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--overlay)] px-4 py-16 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div className="w-full max-w-2xl">
        <Card className="p-3" onClick={(event) => event.stopPropagation()}>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--border)] px-4 py-3">
            <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
            <input
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-list"
              aria-activedescendant={filtered[selectedIndex] ? `command-option-${filtered[selectedIndex].id}` : undefined}
              className="w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              placeholder="Jump to a view or demo action..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
          </label>
          <div id="command-palette-list" role="listbox" className="mt-3 grid gap-2">
            {filtered.map((command, index) => (
              <button
                key={command.id}
                id={`command-option-${command.id}`}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  'rounded-[1.25rem] border border-[var(--border)] px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]',
                  index === selectedIndex && 'bg-[var(--surface-hover)]',
                )}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => activateCommand(index)}
              >
                <div className="font-medium text-[var(--foreground)]">{command.label}</div>
                <div className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {command.description}
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-[1.25rem] border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                No matching commands found.
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
