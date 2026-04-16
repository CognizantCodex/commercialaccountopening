import { CheckCircle2, Clock3, Siren, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatTimestamp } from '@/services/formatters';
import type { CaseTimelineEntry } from '@/types/platform';

const statusIcon = {
  pending: Clock3,
  active: Sparkles,
  done: CheckCircle2,
  issue: Siren,
};

const statusColor = {
  pending: 'text-[var(--muted-foreground)]',
  active: 'text-[var(--accent)]',
  done: 'text-[var(--success)]',
  issue: 'text-[var(--danger)]',
};

export function NarrativeTimeline({
  entries,
  title = 'Timeline',
}: {
  entries: CaseTimelineEntry[];
  title?: string;
}) {
  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <div className="mt-5 space-y-4">
        {entries.map((entry) => {
          const Icon = statusIcon[entry.status];
          return (
            <div key={entry.id} className="flex gap-3">
              <div className={`mt-1 ${statusColor[entry.status]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-[var(--foreground)]">{entry.label}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{entry.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
