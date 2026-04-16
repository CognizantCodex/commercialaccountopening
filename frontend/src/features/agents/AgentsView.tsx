import { useNavigate } from 'react-router-dom';
import { AgentStatusCard } from '@/components/charts/AgentStatusCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { LiveActivityFeed } from '@/components/charts/LiveActivityFeed';
import { TaskThroughputChart } from '@/components/charts/TaskThroughputChart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatformStore } from '@/store';

export function AgentsView() {
  const navigate = useNavigate();
  const agents = usePlatformStore((state) => state.agents);
  const activityFeed = usePlatformStore((state) => state.activityFeed);
  const confidenceMatrix = usePlatformStore((state) => state.confidenceMatrix);
  const taskThroughput = usePlatformStore((state) => state.taskThroughput);

  const autoShare = Math.round(
    agents.reduce((sum, agent) => sum + agent.autoShare, 0) / Math.max(agents.length, 1),
  );
  const manualShare = Math.max(100 - autoShare, 0);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentStatusCard key={agent.id} agent={agent} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <Badge variant="info">Throughput</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Tasks processed by specialized agent
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            The AI operating model is healthiest when work stays distributed across specialists instead of collapsing into one generic workflow.
          </p>
          <div className="mt-4">
            <TaskThroughputChart data={taskThroughput} />
          </div>
        </Card>
        <Card>
          <Badge variant="default">Automation mix</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Auto versus manual handling
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Humans stay focused on the exceptions that change compliance posture while the AI layer handles the routine load.
          </p>
          <DonutChart
            data={[
              { name: 'Automated', value: autoShare, color: 'var(--chart-1)' },
              { name: 'Manual', value: manualShare, color: 'var(--chart-3)' },
            ]}
            centerLabel="Work split"
          />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <LiveActivityFeed
          items={activityFeed}
          onSelect={(item) => {
            void navigate(`/${item.routeHint}`);
          }}
        />
        <HeatmapGrid data={confidenceMatrix} />
      </section>
    </div>
  );
}
