import { Activity, Clock3 } from 'lucide-react';
import { PulseDot } from '@/components/animations/PulseDot';
import { Badge } from '@/components/ui/Badge';
import { formatCompactNumber, formatMs } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { AgentRecord } from '@/types/platform';

export function AgentStatusCard({
  agent,
  selected = false,
  onSelect,
}: {
  agent: AgentRecord;
  selected?: boolean;
  onSelect?: (agent: AgentRecord) => void;
}) {
  const badgeVariant =
    agent.status === 'exception' ? 'danger' : agent.status === 'active' ? 'success' : 'default';
  const className = cn(
    'h-full rounded-[1.75rem] border bg-[var(--surface-elevated)] p-5 text-left shadow-[var(--shadow-card)] transition-all duration-150',
    selected
      ? 'border-[var(--border-strong)] bg-[var(--brand-gradient-soft)]'
      : 'border-[var(--border)] hover:-translate-y-0.5 hover:border-[color:rgba(65,200,255,0.28)]',
    onSelect ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]' : '',
  );

  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PulseDot state={agent.status} />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">{agent.name}</h3>
          </div>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{agent.role}</p>
        </div>
        <Badge variant={badgeVariant}>{agent.status}</Badge>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            <Clock3 className="h-3.5 w-3.5" />
            Latency
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {formatMs(agent.latencyMs)}
          </div>
        </div>
        <div className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            <Activity className="h-3.5 w-3.5" />
            Tasks processed
          </div>
          <div className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {formatCompactNumber(agent.tasksProcessed)}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
            <span>Automation split</span>
            <span>
              {agent.autoShare}% auto / {agent.manualShare}% manual
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary))]"
              style={{ width: `${agent.autoShare}%` }}
            />
          </div>
        </div>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{agent.pulseMessage}</p>
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={className}
        aria-pressed={selected}
        onClick={() => onSelect(agent)}
      >
        {content}
      </button>
    );
  }

  return <section className={className}>{content}</section>;
}
