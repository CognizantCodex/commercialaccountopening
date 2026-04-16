import type {
  CaseRecord,
  CaseTimelineEntry,
  DashboardRoute,
  DecisionLog,
  DrillDownTarget,
  TimelineEvent,
} from '@/types/platform';
import type { PlatformStore } from '@/store/types';

export const routeOrder: DashboardRoute[] = [
  'executive',
  'onboarding',
  'agents',
  'cases',
  'governance',
];

export const routeCatalog: Record<
  DashboardRoute,
  {
    title: string;
    eyebrow: string;
    path: string;
    persona: string;
  }
> = {
  executive: {
    title: 'Executive Command Center',
    eyebrow: 'Business impact',
    path: '/executive',
    persona: 'Executive sponsor',
  },
  onboarding: {
    title: 'Commercial Onboarding Workbench',
    eyebrow: 'Advisory decisions',
    path: '/onboarding',
    persona: 'Onboarding analyst',
  },
  agents: {
    title: 'AI Agent Operations Center',
    eyebrow: 'Operational intelligence',
    path: '/agents',
    persona: 'AI ops lead',
  },
  cases: {
    title: 'KYC Case Explorer',
    eyebrow: 'Case execution',
    path: '/cases',
    persona: 'Case analyst',
  },
  monitoring: {
    title: 'Continuous KYC Monitoring Map',
    eyebrow: 'Real-time surveillance',
    path: '/monitoring',
    persona: 'Monitoring analyst',
  },
  governance: {
    title: 'AI Governance & Explainability Console',
    eyebrow: 'Trust and auditability',
    path: '/governance',
    persona: 'Governance officer',
  },
};

export function getRouteByIndex(index: number) {
  return routeOrder[index] ?? 'executive';
}

export function getCaseTimeline(caseRecord: CaseRecord, timeline: TimelineEvent[]): CaseTimelineEntry[] {
  const eventEntries = timeline
    .filter((event) => event.caseId === caseRecord.id)
    .map<CaseTimelineEntry>((event) => ({
      id: event.id,
      label: event.title,
      timestamp: event.timestamp,
      status:
        event.type === 'qc_failed'
          ? 'issue'
          : event.type === 'monitoring_alert'
            ? 'active'
            : event.type === 'governance_logged'
              ? 'done'
              : 'done',
      detail: event.description,
    }));

  return [
    ...caseRecord.documents.map<CaseTimelineEntry>((document) => ({
      id: document.id,
      label: document.type,
      timestamp: document.uploadedAt,
      status:
        document.status === 'pending'
          ? 'pending'
          : document.status === 'flagged' || document.status === 'failed'
            ? 'issue'
            : 'done',
      detail: `${document.completeness}% completeness with ${document.extractedFields.length} extracted fields.`,
    })),
    ...eventEntries,
  ].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export function getSelectedCase(state: PlatformStore) {
  return state.cases.find((record) => record.id === state.selectedCaseId) ?? state.cases[0] ?? null;
}

export function getSelectedDecision(state: PlatformStore): DecisionLog | null {
  const selectedCase = getSelectedCase(state);
  if (!selectedCase) {
    return state.decisionLogs[0] ?? null;
  }

  return (
    state.decisionLogs.find((decision) => decision.caseId === selectedCase.id) ?? state.decisionLogs[0] ?? null
  );
}

export function buildDecisionBrief(route: DashboardRoute, state: PlatformStore) {
  const selectedCase = getSelectedCase(state);
  const activeAlert = state.alerts[0];
  const selectedDecision = getSelectedDecision(state);

  switch (route) {
    case 'executive':
      return {
        what: 'Straight-through throughput is rising while exception volumes are narrowing.',
        why: 'The platform is converting AI confidence into faster onboarding and lower manual effort.',
        action: 'Prioritize the one high-value case still carrying a monitoring-driven governance flag.',
      };
    case 'agents':
      return {
        what: 'Specialized AI agents are coordinating across intake, QC, monitoring, and audit logging.',
        why: 'Latency and confidence visibility show where the machine can stay autonomous and where humans should step in.',
        action: 'Monitor the QC and monitoring agents, which are the current bottlenecks for Aurora.',
      };
    case 'onboarding':
      return {
        what: 'Commercial onboarding decisions are being routed through stage-specific KYC, credit, and risk logic.',
        why: 'Good-user, bad-user, and manual-review scenarios need fast but auditable decisions without changing system state.',
        action: 'Load a scenario, validate the JSON payload, and confirm the response from the Node decision service.',
      };
    case 'cases':
      return {
        what: `${selectedCase?.caseName ?? 'Selected case'} is the current operational focal point.`,
        why: 'This is where AI assistance, manual exception handling, and policy execution converge.',
        action: selectedCase?.nextBestAction ?? 'Select a case to inspect remediation actions.',
      };
    case 'monitoring':
      return {
        what: `${activeAlert?.title ?? 'No active alerts'} is the most recent monitoring pulse.`,
        why: 'Post-onboarding intelligence changes whether a cleared client remains low-risk in production.',
        action: 'Investigate the newest pulse and confirm whether it should escalate to governance.',
      };
    case 'governance':
      return {
        what: `${selectedDecision?.title ?? 'Governance decision'} is the leading explainability record.`,
        why: 'Audit-ready reasoning protects trust in AI-assisted compliance decisions.',
        action:
          selectedDecision?.overrideReason ??
          'Review evidence attribution and confidence deltas before sign-off.',
      };
  }
}

export function toDrillDown(route: DashboardRoute, caseId?: string): DrillDownTarget {
  return { route, caseId };
}
