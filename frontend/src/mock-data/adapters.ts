import clientsJson from '@/mock-data/clients.json';
import casesJson from '@/mock-data/cases.json';
import timelineJson from '@/mock-data/events-timeline.json';
import {
  type ActivityItem,
  type AgentRecord,
  type CaseRecord,
  type ClientRecord,
  type ConfidenceCell,
  type DecisionLog,
  type DonutSlice,
  type FairnessPoint,
  type HistogramPoint,
  type KpiMetric,
  type MonitoringAlert,
  type RegionPerformance,
  type TaskThroughputPoint,
  type TimelineEvent,
  type TrendPoint,
} from '@/types/platform';
import { formatCompactNumber, formatHours, formatPercent } from '@/lib/utils';

const seedClients = clientsJson as ClientRecord[];
const seedCases = casesJson as CaseRecord[];
const seedTimeline = timelineJson as unknown as TimelineEvent[];

const baseAlerts: MonitoringAlert[] = [
  {
    id: 'alert-polaris-001',
    caseId: 'case-polaris-005',
    clientId: 'client-polaris',
    title: 'Adverse media spike near Sao Paulo operations',
    severity: 'warning',
    region: 'Latin America',
    coordinates: [-46.6333, -23.5505],
    eventTime: '2026-04-16T08:40:00Z',
    falsePositiveRisk: 22,
    description: 'Continuous monitoring picked up a material news cluster tied to a supplier relationship.',
  },
];

const baseDecisions: DecisionLog[] = [
  {
    id: 'decision-lattice-001',
    caseId: 'case-lattice-004',
    title: 'Override approved after secondary review',
    actor: 'Governance Auditor',
    decision: 'overridden',
    confidence: 88,
    overrideReason: 'Manual override preserved after advisor supplied notarized trust deed.',
    createdAt: '2026-04-16T08:20:00Z',
    reasoningChain: [
      'Passport and trust deed matched the declared beneficiary.',
      'Screening agents returned no sanctions, PEP, or adverse media escalation.',
      'Override retained because legacy risk flag was attributable to stale source data.',
    ],
    sources: [
      {
        id: 'source-lattice-1',
        label: 'Trust deed',
        type: 'document',
        confidence: 95,
        excerpt: 'Beneficiary rights and trustee attestation verified.',
      },
      {
        id: 'source-lattice-2',
        label: 'Reviewer note',
        type: 'advisor-note',
        confidence: 83,
        excerpt: 'Second-line governance review confirms exception closure.',
      },
    ],
  },
  {
    id: 'decision-orion-001',
    caseId: 'case-orion-002',
    title: 'Straight-through approval logged',
    actor: 'AI Governance Agent',
    decision: 'approved',
    confidence: 96,
    createdAt: '2026-04-16T08:05:00Z',
    reasoningChain: [
      'Entity structure fully matched registry sources on first pass.',
      'All mandatory KYC evidence satisfied the policy pack with no residual exceptions.',
      'No human override required due to sustained confidence above release threshold.',
    ],
    sources: [
      {
        id: 'source-orion-1',
        label: 'Registry extract',
        type: 'registry',
        confidence: 97,
        excerpt: 'Companies House record and legal entity identifier aligned.',
      },
      {
        id: 'source-orion-2',
        label: 'Sanctions screening',
        type: 'screening',
        confidence: 94,
        excerpt: 'No screening concerns across directors or controllers.',
      },
    ],
  },
];

export interface ScenarioState {
  clients: ClientRecord[];
  cases: CaseRecord[];
  timeline: TimelineEvent[];
  kpis: KpiMetric[];
  regionPerformance: RegionPerformance[];
  trendSeries: TrendPoint[];
  donutSlices: DonutSlice[];
  agents: AgentRecord[];
  activityFeed: ActivityItem[];
  confidenceMatrix: ConfidenceCell[];
  taskThroughput: TaskThroughputPoint[];
  alerts: MonitoringAlert[];
  falsePositiveGauge: number;
  riskHistogram: HistogramPoint[];
  decisionLogs: DecisionLog[];
  fairnessSeries: FairnessPoint[];
  humanOverrideRate: number;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function findCase(cases: CaseRecord[], caseId: string) {
  return cases.find((record) => record.id === caseId);
}

function applyEventToCases(cases: CaseRecord[], event: TimelineEvent) {
  const activeCase = findCase(cases, event.caseId);
  if (!activeCase) {
    return;
  }

  switch (event.type) {
    case 'document_uploaded': {
      activeCase.stage = 'classification';
      activeCase.completeness = 74;
      activeCase.documents = activeCase.documents.map((document) =>
        document.id === 'doc-ubo'
          ? {
              ...document,
              status: 'validated',
              completeness: 96,
              extractedFields: [...document.extractedFields, 'controller-chain'],
            }
          : document,
      );
      activeCase.narrative =
        'Fresh ownership evidence is in, giving the AI engine enough structure to classify the legal hierarchy.';
      activeCase.nextBestAction = 'Wait for the entity-resolution agent to score the controller chain.';
      return;
    }
    case 'agent_classified': {
      activeCase.stage = 'quality-check';
      activeCase.completeness = 86;
      activeCase.onboardingHours = 30.4;
      activeCase.riskScore = 57;
      activeCase.narrative =
        'AI classification completed the ownership graph and narrowed the case to one address quality issue.';
      activeCase.nextBestAction = 'Review the remaining QC issues before the case can exit exceptions.';
      return;
    }
    case 'qc_failed': {
      activeCase.stage = 'advisor-review';
      activeCase.status = 'exception';
      activeCase.qcRules = activeCase.qcRules.map((rule) =>
        rule.id === 'rule-address'
          ? {
              ...rule,
              status: 'failed',
              rationale:
                'AI comparison found inconsistent registered addresses across the proof of address and tax certificate.',
            }
          : rule,
      );
      activeCase.narrative =
        'The platform has isolated a single exception, preserving speed while creating a clear human handoff.';
      activeCase.nextBestAction = 'Request a replacement address document from the relationship team.';
      return;
    }
    case 'advisor_resolved': {
      activeCase.stage = 'monitoring';
      activeCase.status = 'resolved';
      activeCase.completeness = 96;
      activeCase.onboardingHours = 27.8;
      activeCase.riskScore = 51;
      activeCase.qcRules = activeCase.qcRules.map((rule) =>
        rule.id === 'rule-address'
          ? {
              ...rule,
              status: 'passed',
              rationale:
                'Advisor supplied a notarized address certificate and the exception was cleared.',
            }
          : rule,
      );
      activeCase.documents = activeCase.documents.map((document) =>
        document.id === 'doc-proof'
          ? { ...document, status: 'validated', completeness: 100 }
          : document,
      );
      activeCase.narrative =
        'Human intervention cleared the one broken control and returned the case to a monitored state.';
      activeCase.nextBestAction = 'Shift the case into continuous monitoring and watch for post-onboarding risk changes.';
      return;
    }
    case 'monitoring_alert': {
      activeCase.stage = 'monitoring';
      activeCase.status = 'monitored';
      activeCase.riskScore = 68;
      activeCase.narrative =
        'Onboarding is complete, but the client now sits under an active continuous KYC pulse after adverse media surfaced.';
      activeCase.nextBestAction = 'Review the new monitoring alert and determine whether escalation is required.';
      return;
    }
    case 'governance_logged': {
      activeCase.stage = 'governance';
      activeCase.narrative =
        'The final decision is now fully explainable with linked evidence, confidence deltas, and review ownership.';
      activeCase.nextBestAction = 'Share the explainability pack with governance and retain it for audit export.';
      return;
    }
  }
}

function applyEventToAlerts(alerts: MonitoringAlert[], event: TimelineEvent): MonitoringAlert[] {
  if (event.type !== 'monitoring_alert') {
    return alerts;
  }

  const auroraAlert: MonitoringAlert = {
    id: 'alert-aurora-001',
    caseId: event.caseId,
    clientId: event.clientId,
    title: event.title,
    severity: 'critical',
    region: 'Europe',
    coordinates: [-0.1276, 51.5072],
    eventTime: event.timestamp,
    falsePositiveRisk: Number(event.payload?.falsePositiveRisk ?? 18),
    description:
      'New adverse media and subsidiary controller mention require escalation from monitoring into governance review.',
  };

  return [
    auroraAlert,
    ...alerts,
  ];
}

function applyEventToDecisions(decisions: DecisionLog[], event: TimelineEvent): DecisionLog[] {
  if (event.type !== 'governance_logged') {
    return decisions;
  }

  const auroraDecision: DecisionLog = {
    id: 'decision-aurora-001',
    caseId: event.caseId,
    title: 'Aurora explainability record created',
    actor: 'Explainability Console',
    decision: 'flagged',
    confidence: Number(event.payload?.confidence ?? 78),
    createdAt: event.timestamp,
    reasoningChain: [
      'Entity-resolution confidence recovered after the updated UBO register was processed.',
      'A material address mismatch triggered manual review and human evidence collection.',
      'Monitoring surfaced new adverse media, so the case remained flagged despite onboarding completion.',
    ],
    sources: [
      {
        id: 'source-aurora-1',
        label: 'Updated UBO register',
        type: 'document',
        confidence: 94,
        excerpt: 'Latest shareholding record identified the final controller chain.',
      },
      {
        id: 'source-aurora-2',
        label: 'Adverse media screening',
        type: 'screening',
        confidence: 79,
        excerpt: 'Adverse media article linked a disclosed subsidiary controller to an active inquiry.',
      },
      {
        id: 'source-aurora-3',
        label: 'Advisor remediation note',
        type: 'advisor-note',
        confidence: 86,
        excerpt: 'Address exception remediated with notarized replacement evidence.',
      },
    ],
  };

  return [
    auroraDecision,
    ...decisions,
  ];
}

function deriveKpis(cases: CaseRecord[], step: number): KpiMetric[] {
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
      delta: 3.2 + step * 0.2,
      deltaLabel: 'vs prior quarter',
      trend: 'up',
      narrative: 'AI-driven document quality is reducing rework on the highest-value cases.',
      route: 'executive',
    },
    {
      id: 'nigo',
      label: 'NIGO Count',
      value: nigoCount,
      displayValue: `${nigoCount}`,
      delta: -11.4 + step * -0.4,
      deltaLabel: 'month over month',
      trend: 'down',
      narrative: 'Exception volumes are narrowing to a smaller number of policy-critical issues.',
      route: 'cases',
    },
    {
      id: 'stp',
      label: 'STP Rate',
      value: stpRate,
      displayValue: formatPercent(stpRate),
      delta: 8.1 + step * 0.5,
      deltaLabel: 'since AI rollout',
      trend: 'up',
      narrative: 'More clients are clearing onboarding without manual intervention.',
      route: 'agents',
    },
    {
      id: 'flight',
      label: 'Cases in Flight',
      value: inFlight,
      displayValue: formatCompactNumber(inFlight),
      delta: -6.3 + step * -0.2,
      deltaLabel: 'intraday',
      trend: 'down',
      narrative: 'The queue is shrinking even while monitoring signals continue to arrive in real time.',
      route: 'cases',
    },
    {
      id: 'onboarding',
      label: 'Avg Onboarding Time',
      value: averageOnboarding,
      displayValue: formatHours(averageOnboarding),
      delta: -14.8 + step * -0.3,
      deltaLabel: 'since pilot launch',
      trend: 'down',
      narrative: 'Cycle time is compressing as the human team only touches exceptions that matter.',
      route: 'executive',
    },
  ];
}

function deriveRegionPerformance(clients: ClientRecord[], cases: CaseRecord[]): RegionPerformance[] {
  const regionCentroids = new Map<string, [number, number]>();
  for (const client of clients) {
    if (!regionCentroids.has(client.region)) {
      regionCentroids.set(client.region, client.coordinates);
    }
  }

  return Array.from(regionCentroids.entries()).map(([label, centroid]) => {
    const regionCases = cases.filter((record) => record.region === label);
    const performance =
      regionCases.reduce((sum, record) => sum + (record.firstTimeRight ? 100 : record.completeness), 0) /
      Math.max(regionCases.length, 1);
    const stpRate =
      (regionCases.filter((record) => record.stpEligible).length / Math.max(regionCases.length, 1)) *
      100;
    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      performance,
      stpRate,
      bubbleValue: Math.max(regionCases.length * 24, 20),
      centroid,
    };
  });
}

function deriveTrendSeries(step: number): TrendPoint[] {
  return [
    { month: 'Nov', nigo: 18, stp: 48 },
    { month: 'Dec', nigo: 16, stp: 53 },
    { month: 'Jan', nigo: 14, stp: 58 },
    { month: 'Feb', nigo: 11, stp: 62 },
    { month: 'Mar', nigo: 9, stp: 66 + step },
    { month: 'Apr', nigo: Math.max(7 - Math.floor(step / 2), 5), stp: 70 + step },
  ];
}

function deriveDonutSlices(cases: CaseRecord[]): DonutSlice[] {
  const stp = cases.filter((record) => record.stpEligible).length;
  const exceptions = cases.filter((record) => record.status === 'exception').length;
  const monitored = cases.filter((record) => record.status === 'monitored').length;
  return [
    { name: 'STP', value: stp, color: 'var(--chart-1)' },
    { name: 'Exceptions', value: Math.max(exceptions, 1), color: 'var(--chart-4)' },
    { name: 'Monitored', value: Math.max(monitored, 1), color: 'var(--chart-2)' },
  ];
}

function deriveAgents(appliedEvents: TimelineEvent[]): AgentRecord[] {
  const lastType = appliedEvents.at(-1)?.type;
  return [
    {
      id: 'agent-doc',
      name: 'Document Intake Agent',
      role: 'Ingestion and normalization',
      status: lastType === 'document_uploaded' ? 'active' : 'idle',
      latencyMs: 182,
      tasksProcessed: 148 + appliedEvents.length * 4,
      autoShare: 82,
      manualShare: 18,
      pulseMessage: 'Watching inbound evidence and re-indexing document sets.',
    },
    {
      id: 'agent-entity',
      name: 'Entity Resolution Agent',
      role: 'Controller graph construction',
      status: lastType === 'agent_classified' ? 'active' : 'idle',
      latencyMs: lastType === 'agent_classified' ? 412 : 238,
      tasksProcessed: 102 + appliedEvents.length * 5,
      autoShare: 87,
      manualShare: 13,
      pulseMessage: 'Linking beneficial owners and registry sources in real time.',
    },
    {
      id: 'agent-qc',
      name: 'QC Guardrail Agent',
      role: 'Policy and data quality checks',
      status: lastType === 'qc_failed' ? 'exception' : 'active',
      latencyMs: 265,
      tasksProcessed: 126 + appliedEvents.length * 3,
      autoShare: 74,
      manualShare: 26,
      pulseMessage: 'Scoring policy breaches and exception severity.',
    },
    {
      id: 'agent-advisor',
      name: 'Advisor Copilot',
      role: 'Human remediation support',
      status: lastType === 'advisor_resolved' ? 'active' : 'idle',
      latencyMs: 321,
      tasksProcessed: 68 + appliedEvents.length * 2,
      autoShare: 41,
      manualShare: 59,
      pulseMessage: 'Packaging evidence for the relationship and QC teams.',
    },
    {
      id: 'agent-monitor',
      name: 'Monitoring Sentinel',
      role: 'Continuous KYC monitoring',
      status: lastType === 'monitoring_alert' ? 'exception' : 'active',
      latencyMs: 149,
      tasksProcessed: 284 + appliedEvents.length * 8,
      autoShare: 91,
      manualShare: 9,
      pulseMessage: 'Screening watchlists, adverse media, and ownership deltas.',
    },
    {
      id: 'agent-governance',
      name: 'Governance Auditor',
      role: 'Explainability and audit logging',
      status: lastType === 'governance_logged' ? 'active' : 'idle',
      latencyMs: 229,
      tasksProcessed: 54 + appliedEvents.length,
      autoShare: 63,
      manualShare: 37,
      pulseMessage: 'Maintaining auditable reasoning chains and override history.',
    },
  ];
}

function deriveActivityFeed(appliedEvents: TimelineEvent[]): ActivityItem[] {
  if (appliedEvents.length === 0) {
    return [
      {
        id: 'activity-boot',
        title: 'Platform initialized',
        description: 'The demo engine is ready. Start autoplay to watch the client journey unfold.',
        timestamp: 'Live',
        severity: 'info',
        routeHint: 'executive',
      },
    ];
  }

  return [...appliedEvents]
    .reverse()
    .map((event) => ({
      id: `activity-${event.id}`,
      title: event.title,
      description: event.description,
      timestamp: event.timestamp,
      severity: event.severity,
      routeHint: event.routeHint,
    }));
}

function deriveConfidenceMatrix(step: number): ConfidenceCell[] {
  const stepBoost = step * 2.5;
  return [
    ['Passport', 'Identity', 96],
    ['Passport', 'Nationality', 91],
    ['UBO Register', 'Controller Chain', 68 + stepBoost],
    ['UBO Register', 'Ownership %', 72 + stepBoost],
    ['Proof of Address', 'Street Match', 58 + stepBoost],
    ['Proof of Address', 'Postal Code', 81],
    ['Tax Certificate', 'Entity Address', 74],
    ['Tax Certificate', 'Registration ID', 88],
  ].map(([docType, field, confidence]) => ({
    docType: docType as string,
    field: field as string,
    confidence: Number(confidence),
  }));
}

function deriveTaskThroughput(agents: AgentRecord[]): TaskThroughputPoint[] {
  return agents.map((agent) => ({
    agent: agent.name.replace(' Agent', ''),
    tasks: agent.tasksProcessed,
    auto: agent.autoShare,
    manual: agent.manualShare,
  }));
}

function deriveRiskHistogram(alerts: MonitoringAlert[]): HistogramPoint[] {
  const buckets = [
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

function deriveFalsePositiveGauge(alerts: MonitoringAlert[], step: number) {
  const average =
    alerts.reduce((sum, alert) => sum + alert.falsePositiveRisk, 0) / Math.max(alerts.length, 1);
  return Math.max(average - step * 0.8, 9);
}

function deriveFairnessSeries(decisions: DecisionLog[]): FairnessPoint[] {
  const overrideCount = decisions.filter((decision) => decision.decision === 'overridden').length;
  return [
    { cohort: 'NA Financials', parity: 98, overrides: overrideCount },
    { cohort: 'EMEA Holdings', parity: 95, overrides: Math.max(overrideCount - 1, 0) },
    { cohort: 'APAC Trading', parity: 93, overrides: 1 },
    { cohort: 'LATAM Corporate', parity: 96, overrides: 1 },
  ];
}

function deriveHumanOverrideRate(decisions: DecisionLog[]) {
  const overrides = decisions.filter((decision) => decision.decision === 'overridden').length;
  return Number(((overrides / Math.max(decisions.length, 1)) * 100).toFixed(1));
}

export function getSeedTimeline() {
  return clone(seedTimeline);
}

export function buildScenarioState(step: number): ScenarioState {
  const appliedEvents = seedTimeline.slice(0, step);
  const clients = clone(seedClients);
  const cases = clone(seedCases);
  let alerts = clone(baseAlerts);
  let decisions = clone(baseDecisions);

  for (const event of appliedEvents) {
    applyEventToCases(cases, event);
    alerts = applyEventToAlerts(alerts, event);
    decisions = applyEventToDecisions(decisions, event);
  }

  const agents = deriveAgents(appliedEvents);

  return {
    clients,
    cases,
    timeline: clone(seedTimeline),
    kpis: deriveKpis(cases, step),
    regionPerformance: deriveRegionPerformance(clients, cases),
    trendSeries: deriveTrendSeries(step),
    donutSlices: deriveDonutSlices(cases),
    agents,
    activityFeed: deriveActivityFeed(appliedEvents),
    confidenceMatrix: deriveConfidenceMatrix(step),
    taskThroughput: deriveTaskThroughput(agents),
    alerts,
    falsePositiveGauge: deriveFalsePositiveGauge(alerts, step),
    riskHistogram: deriveRiskHistogram(alerts),
    decisionLogs: decisions,
    fairnessSeries: deriveFairnessSeries(decisions),
    humanOverrideRate: deriveHumanOverrideRate(decisions),
  };
}
