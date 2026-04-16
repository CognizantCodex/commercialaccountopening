import { ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatformStore } from '@/store';
import { buildDecisionBrief } from '@/services/selectors';
import type { DashboardRoute } from '@/types/platform';

export function DecisionBrief({ route }: { route: DashboardRoute }) {
  const state = usePlatformStore();
  const brief = buildDecisionBrief(route, state);

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Badge variant="success" className="mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Decision brief
          </Badge>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">What is happening?</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{brief.what}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Why does it matter?</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{brief.why}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-accent-soft)] p-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">What should I do?</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{brief.action}</p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
            Recommended next step
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Card>
  );
}
