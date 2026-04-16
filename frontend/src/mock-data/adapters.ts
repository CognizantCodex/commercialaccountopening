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

function resolveTargetDocument(activeCase: CaseRecord, event: TimelineEvent) {
  const documentId = typeof event.payload?.documentId === 'string' ? event.payload.documentId : null;
  return (
    activeCase.documents.find((document) => document.id === documentId) ??
    activeCase.documents.find((document) => document.status !== 'validated') ??
    activeCase.documents[0]
  );
}

function resolveTargetRule(activeCase: CaseRecord, event: TimelineEvent) {
  const ruleId = typeof event.payload?.ruleId === 'string' ? event.payload.ruleId : null;
  return (
    activeCase.qcRules.find((rule) => rule.id === ruleId) ??
    activeCase.qcRules.find((rule) => rule.status === 'failed' || rule.status === 'manual-review') ??
    activeCase.qcRules[0]
  );
}

function applyEventToCases(cases: CaseRecord[], event: TimelineEvent) {
  const activeCase = findCase(cases, event.caseId);
  if (!activeCase) {
    return;
  }

  const targetDocument = resolveTargetDocument(activeCase, event);
  const targetRule = resolveTargetRule(activeCase, event);

  switch (event.type) {
    case 'document_uploaded': {
      activeCase.stage = 'classification';
      const completenessGain =
        typeof event.payload?.completenessGain === 'number' ? event.payload.completenessGain : 12;
      activeCase.completeness = Math.min(activeCase.completeness + completenessGain, 98);
      activeCase.documents = activeCase.documents.map((document) =>
        document.id === targetDocument?.id
          ? {
              ...document,
              status: 'validated',
              completeness: Math.max(document.completeness, 96),
              extractedFields: Array.from(
                new Set([
                  ...document.extractedFields,
                  typeof event.payload?.extractedField === 'string'
                    ? event.payload.extractedField
                    : 'controller-chain',
                ]),
              ),
            }
          : document,
      );
      activeCase.narrative =
        'Fresh evidence has landed, giving the AI engine enough structure to refresh entity understanding and move the case forward.';
      activeCase.nextBestAction =
        'Wait for the entity-resolution agent to score the updated ownership and policy context.';
      return;
    }
    case 'agent_classified': {
      activeCase.stage = 'quality-check';
      activeCase.completeness = Math.min(activeCase.completeness + 10, 99);
      activeCase.onboardingHours = Math.max(activeCase.onboardingHours - 2.4, 12);
      activeCase.riskScore =
        typeof event.payload?.riskScore === 'number'
          ? event.payload.riskScore
          : Math.max(activeCase.riskScore - 7, 24);
      activeCase.narrative =
        'AI classification refreshed the ownership graph and narrowed the case to a smaller set of policy-critical checks.';
      activeCase.nextBestAction =
        'Review the remaining QC issues before the case can fully exit exceptions.';
      return;
    }
    case 'qc_failed': {
      activeCase.stage = 'advisor-review';
      activeCase.status = 'exception';
      activeCase.qcRules = activeCase.qcRules.map((rule) =>
        rule.id === targetRule?.id
          ? {
              ...rule,
              status: 'failed',
              rationale:
                typeof event.payload?.rationale === 'string'
                  ? event.payload.rationale
                  : 'AI comparison found inconsistent evidence that still needs human remediation.',
            }
          : rule,
      );
      activeCase.narrative =
        'The platform has isolated a single exception, preserving speed while creating a clear human handoff.';
      activeCase.nextBestAction = 'Request fresh evidence from the relationship team to clear the exception.';
      return;
    }
    case 'advisor_resolved': {
      activeCase.stage = 'monitoring';
      activeCase.status = 'resolved';
      activeCase.completeness = Math.max(activeCase.completeness, 96);
      activeCase.onboardingHours = Math.max(activeCase.onboardingHours - 2.6, 11);
      activeCase.riskScore =
        typeof event.payload?.newRiskScore === 'number' ? event.payload.newRiskScore : 51;
      activeCase.qcRules = activeCase.qcRules.map((rule) =>
        rule.id === targetRule?.id
          ? {
              ...rule,
              status: 'passed',
              rationale:
                typeof event.payload?.resolutionRationale === 'string'
                  ? event.payload.resolutionRationale
                  : 'Advisor supplied fresh corroborating evidence and the exception was cleared.',
            }
          : rule,
      );
      activeCase.documents = activeCase.documents.map((document) =>
        document.id === targetDocument?.id
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

function applyEventToAlerts(
  alerts: MonitoringAlert[],
  event: TimelineEvent,
  clients: ClientRecord[],
): MonitoringAlert[] {
  if (event.type !== 'monitoring_alert') {
    return alerts;
  }

  const client = clients.find((record) => record.id === event.clientId);

  const alert: MonitoringAlert = {
    id: `alert-${event.caseId}-${event.id}`,
    caseId: event.caseId,
    clientId: event.clientId,
    title: event.title,
    severity: event.severity,
    region: client?.region ?? 'Monitoring',
    coordinates: client?.coordinates ?? [0, 0],
    eventTime: event.timestamp,
    falsePositiveRisk: Number(event.payload?.falsePositiveRisk ?? 18),
    description: event.description,
  };

  return [alert, ...alerts];
}

function applyEventToDecisions(decisions: DecisionLog[], event: TimelineEvent): DecisionLog[] {
  if (event.type !== 'governance_logged') {
    return decisions;
  }

  const decision: DecisionLog = {
    id: `decision-${event.caseId}-${event.id}`,
    caseId: event.caseId,
    title: `${event.title.replace(/\.$/, '')} record created`,
    actor: 'Explainability Console',
    decision:
      event.payload?.decision === 'approved' ||
      event.payload?.decision === 'escalated' ||
      event.payload?.decision === 'overridden' ||
      event.payload?.decision === 'flagged'
        ? event.payload.decision
        : 'flagged',
    confidence: Number(event.payload?.confidence ?? 78),
    createdAt: event.timestamp,
    reasoningChain: [
      'Entity-resolution confidence was recalculated after refreshed evidence entered the case.',
      'Policy-critical controls and human review steps were captured in the reasoning chain.',
      'The explainability pack preserves the final decision and linked evidence for audit readiness.',
    ],
    sources: [
      {
        id: `source-${event.id}-1`,
        label: typeof event.payload?.primarySourceLabel === 'string' ? event.payload.primarySourceLabel : 'Updated case evidence',
        type: 'document',
        confidence: 94,
        excerpt: 'Latest document set refreshed the policy and ownership context for this case.',
      },
      {
        id: `source-${event.id}-2`,
        label: 'Monitoring and screening output',
        type: 'screening',
        confidence: 79,
        excerpt: 'Screening and monitoring signals were attached to the explainability record.',
      },
      {
        id: `source-${event.id}-3`,
        label: 'Advisor remediation note',
        type: 'advisor-note',
        confidence: 86,
        excerpt: 'Human review commentary and remediation evidence were preserved for audit.',
      },
    ],
  };

  return [decision, ...decisions];
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
    alerts = applyEventToAlerts(alerts, event, clients);
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
