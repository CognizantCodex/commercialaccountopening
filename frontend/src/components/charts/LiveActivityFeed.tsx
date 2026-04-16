import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTimestamp, getSeverityTone } from '@/services/formatters';
import type { ActivityItem } from '@/types/platform';

export function LiveActivityFeed({
  items,
  title = 'Live activity',
  onSelect,
}: {
  items: ActivityItem[];
  title?: string;
  onSelect?: (item: ActivityItem) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [items]);

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        <Badge variant="default">Live</Badge>
      </div>
      <div
        ref={containerRef}
        aria-live="polite"
        className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition-colors hover:bg-[var(--surface-hover)]"
            onClick={() => onSelect?.(item)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-[var(--foreground)]">{item.title}</div>
              <span className={`rounded-full px-2 py-1 text-xs ${getSeverityTone(item.severity)}`}>
                {item.severity}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.description}</p>
            <div className="mt-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {item.timestamp === 'Live' ? item.timestamp : formatTimestamp(item.timestamp)}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
