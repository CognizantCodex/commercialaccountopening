import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AgentStatusCard } from '@/components/charts/AgentStatusCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { HeatmapGrid } from '@/components/charts/HeatmapGrid';
import { LiveActivityFeed } from '@/components/charts/LiveActivityFeed';
import { TaskThroughputChart } from '@/components/charts/TaskThroughputChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { buildAgentDemoState } from '@/features/agents/demo-agents';
import { usePlatformStore } from '@/store';

function getDefaultAgentId(agentIds: Array<{ id: string; status: 'active' | 'idle' | 'exception' }>) {
  return (
    agentIds.find((agent) => agent.status === 'exception')?.id ??
    agentIds.find((agent) => agent.status === 'active')?.id ??
    agentIds[0]?.id ??
    null
  );
}

export function AgentsView() {
  const navigate = useNavigate();
  const dataSource = usePlatformStore((state) => state.dataSource);
  const agents = usePlatformStore((state) => state.agents);
  const activityFeed = usePlatformStore((state) => state.activityFeed);
  const confidenceMatrix = usePlatformStore((state) => state.confidenceMatrix);
  const taskThroughput = usePlatformStore((state) => state.taskThroughput);
  const timeline = usePlatformStore((state) => state.timeline);
  const currentStep = usePlatformStore((state) => state.currentStep);
  const alerts = usePlatformStore((state) => state.alerts);
  const decisionLogs = usePlatformStore((state) => state.decisionLogs);
  const applyTimelineEvent = usePlatformStore((state) => state.applyTimelineEvent);
  const selectCase = usePlatformStore((state) => state.selectCase);
  const focusRegion = usePlatformStore((state) => state.focusRegion);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => getDefaultAgentId(agents));

  const autoShare = Math.round(
    agents.reduce((sum, agent) => sum + agent.autoShare, 0) / Math.max(agents.length, 1),
  );
  const manualShare = Math.max(100 - autoShare, 0);
  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );
  const selectedAgentDemo = useMemo(
    () =>
      selectedAgent
        ? buildAgentDemoState({
            agent: selectedAgent,
            timeline,
            currentStep,
            activityFeed,
            alerts,
            decisionLogs,
          })
        : null,
    [activityFeed, alerts, currentStep, decisionLogs, selectedAgent, timeline],
  );
  const visibleActivity = selectedAgentDemo?.relatedActivity.length
    ? selectedAgentDemo.relatedActivity
    : activityFeed;

  useEffect(() => {
    setSelectedAgentId((currentAgentId) =>
      agents.some((agent) => agent.id === currentAgentId)
        ? currentAgentId
        : getDefaultAgentId(agents),
    );
  }, [agents]);

  const openDrillDown = (route: 'executive' | 'agents' | 'cases' | 'monitoring' | 'governance') => {
    const caseId = selectedAgentDemo?.event?.caseId;

    if (caseId && route !== 'executive') {
      selectCase(caseId);
    }

    if (route === 'monitoring') {
      focusRegion(alerts[0]?.region ?? null);
    }

    void navigate(`/${route}`);
  };

  if (!selectedAgent || !selectedAgentDemo) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentStatusCard
            key={agent.id}
            agent={agent}
            selected={agent.id === selectedAgent.id}
            onSelect={(nextAgent) => setSelectedAgentId(nextAgent.id)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="info">Agent drill-down</Badge>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                {selectedAgent.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {selectedAgentDemo.blueprint.mission}
              </p>
            </div>
            <Badge variant={selectedAgentDemo.sampleStatusTone}>
              {selectedAgentDemo.sampleStatusLabel}
            </Badge>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Presenter lens
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {selectedAgentDemo.blueprint.operatorLens}
            </p>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[1.35rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Signals owned
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAgentDemo.blueprint.ownedSignals.map((signal) => (
                  <Badge key={signal} variant="default">
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                What to watch
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedAgentDemo.blueprint.watchList.map((metric) => (
                  <Badge key={metric} variant="info">
                    {metric}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.35rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(0,201,177,0.12),rgba(31,111,235,0.08))] p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Operational spotlight
            </div>
            <div className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {selectedAgentDemo.spotlightTitle}
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {selectedAgentDemo.spotlightBody}
            </p>
          </div>
        </Card>

        <Card>
          <Badge variant="warning">Demo agents</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Sample demo implementation
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Trigger the scripted step owned by this agent, then jump directly into the most relevant workspace for a deeper walkthrough.
          </p>

          <div className="mt-4 rounded-[1.35rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-[var(--foreground)]">
                {selectedAgentDemo.event?.title ?? 'No sample event configured'}
              </div>
              <Badge variant={selectedAgentDemo.sampleStatusTone}>
                Step {selectedAgentDemo.eventIndex + 1 || 'N/A'}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {selectedAgentDemo.event?.description ?? selectedAgentDemo.blueprint.outcome}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
              {selectedAgentDemo.blueprint.sampleActionDescription}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={() => selectedAgentDemo.event && applyTimelineEvent(selectedAgentDemo.event)}
                disabled={!selectedAgentDemo.canRunSample || dataSource === 'live'}
              >
                <Sparkles className="h-4 w-4" />
                {dataSource === 'live'
                  ? 'Switch to demo for sample'
                  : selectedAgentDemo.canRunSample
                  ? selectedAgentDemo.blueprint.sampleActionLabel
                  : 'Sample already applied'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => openDrillDown(selectedAgentDemo.blueprint.drillDowns[0].route)}
              >
                <ArrowRight className="h-4 w-4" />
                {selectedAgentDemo.blueprint.drillDowns[0].label}
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selectedAgentDemo.blueprint.drillDowns.map((drillDown) => (
              <button
                key={drillDown.route}
                type="button"
                className="w-full rounded-[1.35rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.03)] p-4 text-left transition-colors hover:bg-[color:rgba(255,255,255,0.05)]"
                onClick={() => openDrillDown(drillDown.route)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-[var(--foreground)]">{drillDown.label}</div>
                  <ArrowRight className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {drillDown.description}
                </p>
              </button>
            ))}
          </div>
        </Card>
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
          items={visibleActivity}
          title={`${selectedAgent.name} activity`}
          onSelect={(item) => {
            void navigate(`/${item.routeHint}`);
          }}
        />
        <HeatmapGrid data={confidenceMatrix} />
      </section>
    </div>
  );
}
