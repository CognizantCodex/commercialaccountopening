import type {
  ActivityItem,
  AgentRecord,
  DashboardRoute,
  DecisionLog,
  MonitoringAlert,
  TimelineEvent,
  TimelineEventType,
} from '@/types/platform';

export interface AgentRouteDrillDown {
  route: DashboardRoute;
  label: string;
  description: string;
}

export interface AgentDemoBlueprint {
  id: AgentRecord['id'];
  mission: string;
  operatorLens: string;
  outcome: string;
  watchList: string[];
  ownedSignals: string[];
  sampleActionLabel: string;
  sampleActionDescription: string;
  eventType: TimelineEventType;
  drillDowns: AgentRouteDrillDown[];
}

export interface AgentDemoState {
  blueprint: AgentDemoBlueprint;
  event: TimelineEvent | null;
  eventIndex: number;
  sampleStatusLabel: string;
  sampleStatusTone: 'default' | 'info' | 'warning' | 'success';
  canRunSample: boolean;
  relatedActivity: ActivityItem[];
  spotlightTitle: string;
  spotlightBody: string;
}

const agentBlueprints: Record<AgentRecord['id'], AgentDemoBlueprint> = {
  'agent-doc': {
    id: 'agent-doc',
    mission: 'Normalize inbound evidence and assemble an extraction-ready package for downstream specialists.',
    operatorLens: 'Best for showing how the system starts with messy, real-world onboarding documents.',
    outcome: 'A stronger source bundle raises completeness before any entity reasoning begins.',
    watchList: ['Document completeness', 'Normalization latency', 'Extraction coverage'],
    ownedSignals: ['Updated UBO register', 'New evidence upload', 'Document indexing'],
    sampleActionLabel: 'Run intake sample',
    sampleActionDescription: 'Applies the scripted document upload event for Aurora Atlas Capital.',
    eventType: 'document_uploaded',
    drillDowns: [
      {
        route: 'cases',
        label: 'Open case workspace',
        description: 'Inspect document completeness, QC posture, and next best action.',
      },
      {
        route: 'executive',
        label: 'Open executive impact',
        description: 'Show how better intake quality lifts straight-through processing.',
      },
    ],
  },
  'agent-entity': {
    id: 'agent-entity',
    mission: 'Resolve legal structures, beneficial owners, and controller relationships into a verified graph.',
    operatorLens: 'Use this when the story needs a clear “AI did the hard graph work” moment.',
    outcome: 'The case is ready for policy checks with the ownership chain linked to registry evidence.',
    watchList: ['Controller-chain confidence', 'Resolution latency', 'Registry match rate'],
    ownedSignals: ['Ownership graph', 'Registry linkage', 'Controller hierarchy'],
    sampleActionLabel: 'Run classification sample',
    sampleActionDescription: 'Triggers the entity-classification step and updates the agent telemetry.',
    eventType: 'agent_classified',
    drillDowns: [
      {
        route: 'cases',
        label: 'Open case timeline',
        description: 'See the case advance into quality checks with richer ownership data.',
      },
      {
        route: 'governance',
        label: 'Open audit path',
        description: 'Follow how entity evidence later supports explainable decisions.',
      },
    ],
  },
  'agent-qc': {
    id: 'agent-qc',
    mission: 'Apply policy controls and surface only the exceptions that need human judgment.',
    operatorLens: 'This is the clearest control-point for showing safe autonomy versus escalation.',
    outcome: 'The platform preserves one high-signal exception instead of routing the whole case to manual work.',
    watchList: ['Rule-failure count', 'Exception severity', 'False reject risk'],
    ownedSignals: ['Address mismatch', 'Policy breach', 'Control-by-control rationale'],
    sampleActionLabel: 'Run QC exception sample',
    sampleActionDescription: 'Applies the scripted policy failure to demonstrate controlled escalation.',
    eventType: 'qc_failed',
    drillDowns: [
      {
        route: 'cases',
        label: 'Open exception rail',
        description: 'Inspect the failing control and recommended next action.',
      },
      {
        route: 'governance',
        label: 'Open audit controls',
        description: 'Show how exceptions remain explainable and reviewable.',
      },
    ],
  },
  'agent-advisor': {
    id: 'agent-advisor',
    mission: 'Package the right evidence and recommendations so humans can resolve exceptions quickly.',
    operatorLens: 'This is the human-in-the-loop handoff point for the demo.',
    outcome: 'Manual effort stays targeted, fast, and attributable instead of becoming a broad fallback.',
    watchList: ['Resolution time', 'Human touch rate', 'Evidence package quality'],
    ownedSignals: ['Replacement address evidence', 'Reviewer note', 'Exception closure'],
    sampleActionLabel: 'Run remediation sample',
    sampleActionDescription: 'Applies the advisor resolution step to return the case to a healthy state.',
    eventType: 'advisor_resolved',
    drillDowns: [
      {
        route: 'cases',
        label: 'Open remediation case',
        description: 'Confirm the exception closes and the next step changes.',
      },
      {
        route: 'governance',
        label: 'Open decision history',
        description: 'Show the future audit record that captures the human intervention.',
      },
    ],
  },
  'agent-monitor': {
    id: 'agent-monitor',
    mission: 'Watch live client risk signals after onboarding and escalate the ones that change posture.',
    operatorLens: 'Use this to pivot the demo from onboarding into always-on surveillance.',
    outcome: 'Continuous monitoring turns a cleared client into an actionable alert without re-reviewing every account.',
    watchList: ['Alert precision', 'Regional hot spots', 'Escalation latency'],
    ownedSignals: ['Adverse media', 'Watchlist deltas', 'Controller changes'],
    sampleActionLabel: 'Run monitoring sample',
    sampleActionDescription: 'Triggers the scripted London monitoring alert from the agents workspace.',
    eventType: 'monitoring_alert',
    drillDowns: [
      {
        route: 'monitoring',
        label: 'Open monitoring map',
        description: 'Jump to the live alert map and regional action queue.',
      },
      {
        route: 'cases',
        label: 'Open impacted case',
        description: 'Inspect the monitored client record tied to the alert.',
      },
    ],
  },
  'agent-governance': {
    id: 'agent-governance',
    mission: 'Capture reasoning, evidence, and reviewer outcomes so every AI-assisted decision is audit ready.',
    operatorLens: 'This closes the demo with explainability and governance controls.',
    outcome: 'The platform can defend how it reached the decision, who overrode what, and which evidence mattered.',
    watchList: ['Override rate', 'Evidence attribution', 'Confidence deltas'],
    ownedSignals: ['Reasoning chain', 'Source attribution', 'Reviewer outcome'],
    sampleActionLabel: 'Run audit-log sample',
    sampleActionDescription: 'Applies the explainability event and prepares the governance console for review.',
    eventType: 'governance_logged',
    drillDowns: [
      {
        route: 'governance',
        label: 'Open governance console',
        description: 'Inspect the reasoning chain, evidence, and fairness indicators.',
      },
      {
        route: 'cases',
        label: 'Open source case',
        description: 'Tie the audit trail back to the operational case history.',
      },
    ],
  },
};

export function getAgentBlueprint(agentId: AgentRecord['id']) {
  return agentBlueprints[agentId];
}

export function buildAgentDemoState({
  agent,
  timeline,
  currentStep,
  activityFeed,
  alerts,
  decisionLogs,
}: {
  agent: AgentRecord;
  timeline: TimelineEvent[];
  currentStep: number;
  activityFeed: ActivityItem[];
  alerts: MonitoringAlert[];
  decisionLogs: DecisionLog[];
}): AgentDemoState {
  const blueprint = getAgentBlueprint(agent.id);
  const eventIndex = timeline.findIndex((item) => item.type === blueprint.eventType);
  const event = eventIndex === -1 ? null : timeline[eventIndex];
  const eventApplied = eventIndex !== -1 && currentStep > eventIndex;
  const eventReady = eventIndex !== -1 && currentStep <= eventIndex;
  const relatedActivity = activityFeed.filter((item) =>
    blueprint.drillDowns.some((drillDown) => drillDown.route === item.routeHint),
  );

  let spotlightTitle = `${agent.name} is standing by`;
  let spotlightBody = blueprint.outcome;

  if (agent.id === 'agent-monitor' && alerts[0]) {
    spotlightTitle = alerts[0].title;
    spotlightBody = alerts[0].description;
  }

  if (agent.id === 'agent-governance' && decisionLogs[0]) {
    spotlightTitle = decisionLogs[0].title;
    spotlightBody = decisionLogs[0].overrideReason ?? decisionLogs[0].reasoningChain[0] ?? blueprint.outcome;
  }

  if (agent.id === 'agent-qc') {
    spotlightTitle = 'QC guardrails isolate only the broken control';
    spotlightBody = 'The demo shows a single address mismatch being escalated instead of routing the full case to manual review.';
  }

  return {
    blueprint,
    event,
    eventIndex,
    sampleStatusLabel: eventApplied ? 'Sample completed' : eventReady ? 'Sample ready' : 'Sample unavailable',
    sampleStatusTone: eventApplied ? 'success' : eventReady ? 'info' : 'warning',
    canRunSample: Boolean(event) && !eventApplied,
    relatedActivity,
    spotlightTitle,
    spotlightBody,
  };
}
