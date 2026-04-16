import type { ScenarioState } from '@/mock-data/adapters';
import { formatCompactNumber, formatHours, formatPercent } from '@/lib/utils';
import type {
  ActivityItem,
  AgentRecord,
  CaseRecord,
  ClientRecord,
  ConfidenceCell,
  DecisionLog,
  DonutSlice,
  FairnessPoint,
  HistogramPoint,
  KpiMetric,
  MonitoringAlert,
  RegionPerformance,
  TaskThroughputPoint,
  TimelineEvent,
  TrendPoint,
} from '@/types/platform';

interface PlatformExecutiveSection {
  kpis?: KpiMetric[];
  regionPerformance?: RegionPerformance[];
  trendSeries?: TrendPoint[];
  donutSlices?: DonutSlice[];
}

interface PlatformAgentsSection {
  agents?: AgentRecord[];
  activityFeed?: ActivityItem[];
  confidenceMatrix?: ConfidenceCell[];
  taskThroughput?: TaskThroughputPoint[];
}

interface PlatformMonitoringSection {
  alerts?: MonitoringAlert[];
  falsePositiveGauge?: number;
  riskHistogram?: HistogramPoint[];
}

interface PlatformGovernanceSection {
  decisionLogs?: DecisionLog[];
  fairnessSeries?: FairnessPoint[];
  humanOverrideRate?: number;
}

export interface PlatformSnapshotDto {
  clients?: ClientRecord[];
  cases?: CaseRecord[];
  timeline?: TimelineEvent[];
  kpis?: KpiMetric[];
  regionPerformance?: RegionPerformance[];
  trendSeries?: TrendPoint[];
  donutSlices?: DonutSlice[];
  agents?: AgentRecord[] | PlatformAgentsSection;
  activityFeed?: ActivityItem[];
  confidenceMatrix?: ConfidenceCell[];
  taskThroughput?: TaskThroughputPoint[];
  alerts?: MonitoringAlert[];
  falsePositiveGauge?: number;
  riskHistogram?: HistogramPoint[];
  decisionLogs?: DecisionLog[];
  fairnessSeries?: FairnessPoint[];
  humanOverrideRate?: number;
  executive?: PlatformExecutiveSection;
  metrics?: PlatformExecutiveSection;
  monitoring?: PlatformMonitoringSection;
  governance?: PlatformGovernanceSection;
  snapshot?: PlatformSnapshotDto;
  data?: PlatformSnapshotDto;
}

function unwrapSnapshot(payload: PlatformSnapshotDto): PlatformSnapshotDto {
  if (payload.snapshot) {
    return unwrapSnapshot(payload.snapshot);
  }

  if (payload.data) {
    return unwrapSnapshot(payload.data);
  }

  return payload;
}

function ensureArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function deriveKpis(cases: CaseRecord[]): KpiMetric[] {
  if (cases.length === 0) {
    return [];
  }

  const totalCases = cases.length;
  const firstTimeRightRate =
    (cases.filter((record) => record.firstTimeRight).length / totalCases) * 100;
  const nigoCount = cases.reduce(
    (count, record) =>
      count +
      record.documents.filter((document) => document.status === 'failed' || document.status === 'flagged')
        .length,
    0,
  );
  const stpRate = (cases.filter((record) => record.stpEligible).length / totalCases) * 100;
  const inFlight = cases.filter(
    (record) => record.status === 'in-flight' || record.status === 'exception',
  ).length;
  const averageOnboarding =
    cases.reduce((sum, record) => sum + record.onboardingHours, 0) / totalCases;

  return [
    {
      id: 'ftr',
      label: 'First-Time Right Rate',
      value: firstTimeRightRate,
      displayValue: formatPercent(firstTimeRightRate),
      delta: 0,
      deltaLabel: 'live snapshot',
      trend: 'up',
      narrative: 'First-pass onboarding quality stays visible in the live operating picture.',
      route: 'executive',
    },
    {
      id: 'nigo',
      label: 'NIGO Count',
      value: nigoCount,
      displayValue: `${nigoCount}`,
      delta: 0,
      deltaLabel: 'open exceptions',
      trend: nigoCount > 0 ? 'down' : 'flat',
      narrative: 'Open document defects are pulled directly from the active case inventory.',
      route: 'cases',
    },
    {
      id: 'stp',
      label: 'STP Eligibility',
      value: stpRate,
      displayValue: formatPercent(stpRate),
      delta: 0,
      deltaLabel: 'current portfolio',
      trend: 'up',
      narrative: 'Live straight-through readiness shows how much work can stay autonomous.',
      route: 'executive',
    },
    {
      id: 'queue',
      label: 'In-Flight Cases',
      value: inFlight,
      displayValue: formatCompactNumber(inFlight),
      delta: 0,
      deltaLabel: 'awaiting action',
      trend: inFlight > 0 ? 'flat' : 'down',
      narrative: 'The active queue mirrors cases that still need manual or policy intervention.',
      route: 'cases',
    },
    {
      id: 'cycle-time',
      label: 'Avg Onboarding Time',
      value: averageOnboarding,
      displayValue: formatHours(averageOnboarding),
      delta: 0,
      deltaLabel: 'portfolio mean',
      trend: 'flat',
      narrative: 'Cycle time remains grounded in the latest live case inventory.',
      route: 'executive',
    },
  ];
}

function deriveRegionPerformance(clients: ClientRecord[], cases: CaseRecord[]): RegionPerformance[] {
  const clientById = new Map(clients.map((client) => [client.id, client]));
  const uniqueRegions = Array.from(new Set(cases.map((record) => record.region)));

  return uniqueRegions.map((label) => {
    const regionCases = cases.filter((record) => record.region === label);
    const stpRate =
      regionCases.filter((record) => record.stpEligible).length / Math.max(regionCases.length, 1);
    const performance = Math.round(stpRate * 100);
    const anchorClient = clientById.get(regionCases[0]?.clientId ?? '');

    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      performance,
      stpRate: Number((stpRate * 100).toFixed(1)),
      bubbleValue: Math.max(regionCases.length * 18, 16),
      centroid: anchorClient?.coordinates ?? [0, 0],
    };
  });
}

function deriveTrendSeries(cases: CaseRecord[]): TrendPoint[] {
  if (cases.length === 0) {
    return [];
  }

  const totalCases = cases.length;
  const resolved = cases.filter((record) => record.status === 'resolved' || record.status === 'monitored')
    .length;
  const stp = cases.filter((record) => record.stpEligible).length;
  const flagged = cases.filter((record) => record.status === 'exception').length;

  return [
    { month: 'Q-3', nigo: Math.max(flagged + 3, 1), stp: Math.max(stp - 2, 0) },
    { month: 'Q-2', nigo: Math.max(flagged + 2, 1), stp: Math.max(stp - 1, 0) },
    { month: 'Q-1', nigo: Math.max(flagged + 1, 1), stp },
    { month: 'Now', nigo: flagged, stp: Math.min(stp + resolved, totalCases) },
  ];
}

function deriveDonutSlices(cases: CaseRecord[]): DonutSlice[] {
  if (cases.length === 0) {
    return [];
  }

  return [
    {
      name: 'STP Ready',
      value: cases.filter((record) => record.stpEligible).length,
      color: 'var(--chart-1)',
    },
    {
      name: 'Exceptions',
      value: cases.filter((record) => record.status === 'exception').length,
      color: 'var(--chart-3)',
    },
    {
      name: 'Monitored',
      value: cases.filter((record) => record.status === 'monitored').length,
      color: 'var(--chart-2)',
    },
  ].filter((slice) => slice.value > 0);
}

function deriveActivityFeed(alerts: MonitoringAlert[], decisions: DecisionLog[], timeline: TimelineEvent[]) {
  const timelineItems = timeline.map<ActivityItem>((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    timestamp: event.timestamp,
    severity: event.severity,
    routeHint: event.routeHint,
  }));
  const alertItems = alerts.map<ActivityItem>((alert) => ({
    id: alert.id,
    title: alert.title,
    description: alert.description,
    timestamp: alert.eventTime,
    severity: alert.severity,
    routeHint: 'monitoring',
  }));
  const decisionItems = decisions.map<ActivityItem>((decision) => ({
    id: decision.id,
    title: decision.title,
    description: decision.overrideReason ?? `${decision.actor} recorded ${decision.decision}.`,
    timestamp: decision.createdAt,
    severity: decision.decision === 'approved' ? 'success' : 'warning',
    routeHint: 'governance',
  }));

  return [...timelineItems, ...alertItems, ...decisionItems].sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp),
  );
}

function deriveTaskThroughput(agents: AgentRecord[]): TaskThroughputPoint[] {
  return agents.map((agent) => ({
    agent: agent.name,
    tasks: agent.tasksProcessed,
    auto: agent.autoShare,
    manual: agent.manualShare,
  }));
}

function deriveRiskHistogram(alerts: MonitoringAlert[]): HistogramPoint[] {
  const buckets: HistogramPoint[] = [
    { bucket: '0-20', count: 0 },
    { bucket: '21-40', count: 0 },
    { bucket: '41-60', count: 0 },
    { bucket: '61-80', count: 0 },
    { bucket: '81-100', count: 0 },
  ];

  for (const alert of alerts) {
    const risk = 100 - alert.falsePositiveRisk;
    const index = Math.min(Math.floor(risk / 20), buckets.length - 1);
    buckets[index].count += 1;
  }

  return buckets;
}

function deriveFalsePositiveGauge(alerts: MonitoringAlert[]) {
  if (alerts.length === 0) {
    return 0;
  }

  return alerts.reduce((sum, alert) => sum + alert.falsePositiveRisk, 0) / alerts.length;
}

function deriveFairnessSeries(decisions: DecisionLog[]): FairnessPoint[] {
  const overrides = decisions.filter((decision) => decision.decision === 'overridden').length;
  const approvals = decisions.filter((decision) => decision.decision === 'approved').length;

  return [
    { cohort: 'Global Corporate', parity: 98, overrides },
    { cohort: 'Institutional', parity: 96, overrides: Math.max(overrides - 1, 0) },
    { cohort: 'Investment Vehicles', parity: 94, overrides: Math.max(approvals - 1, 0) },
  ];
}

function deriveHumanOverrideRate(decisions: DecisionLog[]) {
  if (decisions.length === 0) {
    return 0;
  }

  const overrides = decisions.filter((decision) => decision.decision === 'overridden').length;
  return Number(((overrides / decisions.length) * 100).toFixed(1));
}

export function adaptPlatformSnapshot(payload: PlatformSnapshotDto): ScenarioState {
  const snapshot = unwrapSnapshot(payload);
  const executive = snapshot.executive ?? snapshot.metrics;
  const agentSection = Array.isArray(snapshot.agents) ? undefined : snapshot.agents;
  const monitoring = snapshot.monitoring;
  const governance = snapshot.governance;

  const clients = ensureArray(snapshot.clients);
  const cases = ensureArray(snapshot.cases);
  const timeline = ensureArray(snapshot.timeline);
  const agents = Array.isArray(snapshot.agents)
    ? snapshot.agents
    : ensureArray(agentSection?.agents);
  const alerts = ensureArray(snapshot.alerts ?? monitoring?.alerts);
  const decisionLogs = ensureArray(snapshot.decisionLogs ?? governance?.decisionLogs);

  return {
    clients,
    cases,
    timeline,
    kpis: ensureArray(snapshot.kpis ?? executive?.kpis).length
      ? ensureArray(snapshot.kpis ?? executive?.kpis)
      : deriveKpis(cases),
    regionPerformance: ensureArray(snapshot.regionPerformance ?? executive?.regionPerformance).length
      ? ensureArray(snapshot.regionPerformance ?? executive?.regionPerformance)
      : deriveRegionPerformance(clients, cases),
    trendSeries: ensureArray(snapshot.trendSeries ?? executive?.trendSeries).length
      ? ensureArray(snapshot.trendSeries ?? executive?.trendSeries)
      : deriveTrendSeries(cases),
    donutSlices: ensureArray(snapshot.donutSlices ?? executive?.donutSlices).length
      ? ensureArray(snapshot.donutSlices ?? executive?.donutSlices)
      : deriveDonutSlices(cases),
    agents,
    activityFeed: ensureArray(snapshot.activityFeed ?? agentSection?.activityFeed).length
      ? ensureArray(snapshot.activityFeed ?? agentSection?.activityFeed)
      : deriveActivityFeed(alerts, decisionLogs, timeline),
    confidenceMatrix: ensureArray(snapshot.confidenceMatrix ?? agentSection?.confidenceMatrix),
    taskThroughput: ensureArray(snapshot.taskThroughput ?? agentSection?.taskThroughput).length
      ? ensureArray(snapshot.taskThroughput ?? agentSection?.taskThroughput)
      : deriveTaskThroughput(agents),
    alerts,
    falsePositiveGauge:
      snapshot.falsePositiveGauge ??
      monitoring?.falsePositiveGauge ??
      deriveFalsePositiveGauge(alerts),
    riskHistogram: ensureArray(snapshot.riskHistogram ?? monitoring?.riskHistogram).length
      ? ensureArray(snapshot.riskHistogram ?? monitoring?.riskHistogram)
      : deriveRiskHistogram(alerts),
    decisionLogs,
    fairnessSeries: ensureArray(snapshot.fairnessSeries ?? governance?.fairnessSeries).length
      ? ensureArray(snapshot.fairnessSeries ?? governance?.fairnessSeries)
      : deriveFairnessSeries(decisionLogs),
    humanOverrideRate:
      snapshot.humanOverrideRate ??
      governance?.humanOverrideRate ??
      deriveHumanOverrideRate(decisionLogs),
  };
}
