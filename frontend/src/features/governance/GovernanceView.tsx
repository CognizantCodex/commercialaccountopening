import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ConfidenceWaterfall } from '@/components/charts/ConfidenceWaterfall';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { usePlatformStore } from '@/store';
import { getSelectedDecision } from '@/services/selectors';
import type { WaterfallStep } from '@/types/platform';

function buildWaterfall(confidence: number): WaterfallStep[] {
  const steps = [
    { label: 'Docs', value: 24, cumulative: 24, type: 'gain' as const },
    { label: 'Registry', value: 20, cumulative: 44, type: 'gain' as const },
    { label: 'QC', value: -12, cumulative: 32, type: 'loss' as const },
    { label: 'Monitoring', value: -8, cumulative: 24, type: 'loss' as const },
    { label: 'Final', value: confidence, cumulative: confidence, type: 'result' as const },
  ];
  return steps;
}

export function GovernanceView() {
  const decisionLogs = usePlatformStore((state) => state.decisionLogs);
  const fairnessSeries = usePlatformStore((state) => state.fairnessSeries);
  const humanOverrideRate = usePlatformStore((state) => state.humanOverrideRate);
  const selectCase = usePlatformStore((state) => state.selectCase);
  const selectedDecision = usePlatformStore(getSelectedDecision);

  const waterfallSteps = useMemo(
    () => buildWaterfall(selectedDecision?.confidence ?? 0),
    [selectedDecision?.confidence],
  );

  if (!selectedDecision) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <Badge variant="info">Decision log</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            AI and human decisions, ready for audit
          </h3>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  <th className="px-3 py-2">Decision</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {decisionLogs.map((decision) => (
                  <tr
                    key={decision.id}
                    className="cursor-pointer rounded-[1.25rem] bg-[color:rgba(255,255,255,0.03)]"
                    onClick={() => selectCase(decision.caseId)}
                  >
                    <td className="rounded-l-[1.25rem] px-3 py-3 text-sm font-medium text-[var(--foreground)]">
                      {decision.title}
                    </td>
                    <td className="px-3 py-3 text-sm text-[var(--muted-foreground)]">{decision.actor}</td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={
                          decision.decision === 'approved'
                            ? 'success'
                            : decision.decision === 'overridden'
                              ? 'warning'
                              : 'danger'
                        }
                      >
                        {decision.decision}
                      </Badge>
                    </td>
                    <td className="rounded-r-[1.25rem] px-3 py-3 text-sm text-[var(--foreground)]">
                      {decision.confidence}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <Badge variant="warning">Human override KPI</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Override rate is contained
          </h3>
          <div className="mt-4 text-5xl font-semibold text-[var(--foreground)]">
            {humanOverrideRate.toFixed(1)}%
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
            Overrides stay visible and attributable, which keeps trust high while preserving human authority where it matters.
          </p>
          {selectedDecision.overrideReason && (
            <div className="mt-4 rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
              {selectedDecision.overrideReason}
            </div>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <Badge variant="default">Reasoning chain</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Why the platform landed here
          </h3>
          <div className="mt-4 space-y-3">
            {selectedDecision.reasoningChain.map((reason, index) => (
              <div
                key={reason}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Step {index + 1}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{reason}</p>
              </div>
            ))}
          </div>
        </Card>
        <ConfidenceWaterfall steps={waterfallSteps} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <Badge variant="info">Source attribution</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Evidence attached to the decision
          </h3>
          <div className="mt-4 space-y-3">
            {selectedDecision.sources.map((source) => (
              <div
                key={source.id}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-[var(--foreground)]">{source.label}</div>
                  <Badge variant="default">{source.confidence}% confidence</Badge>
                </div>
                <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {source.type}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {source.excerpt}
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Badge variant="success">Bias and fairness</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Fairness drift remains within tolerance
          </h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fairnessSeries}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="cohort" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(13,17,23,0.92)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 16,
                  }}
                />
                <Bar dataKey="parity" fill="var(--accent)" radius={[10, 10, 0, 0]} />
                <Bar dataKey="overrides" fill="var(--accent-secondary)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>
    </div>
  );
}
