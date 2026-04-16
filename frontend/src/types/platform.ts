export type DashboardRoute =
  | 'executive'
  | 'agents'
  | 'cases'
  | 'monitoring'
  | 'governance';

export type PersonaId =
  | 'executive-sponsor'
  | 'ai-ops-lead'
  | 'case-analyst'
  | 'monitoring-analyst'
  | 'governance-officer';

export type ThemeMode = 'dark' | 'light' | 'system';

export type DemoMode = 'autoplay' | 'interactive';

export type DataSourceMode = 'demo' | 'live';

export type TimelineEventType =
  | 'document_uploaded'
  | 'agent_classified'
  | 'qc_failed'
  | 'advisor_resolved'
  | 'monitoring_alert'
  | 'governance_logged';

export type Severity = 'info' | 'success' | 'warning' | 'critical';

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  delta?: number;
  deltaLabel?: string;
  trend: 'up' | 'down' | 'flat';
  narrative: string;
  route?: DashboardRoute;
}

export interface ClientRecord {
  id: string;
  name: string;
  segment: string;
  headquarters: string;
  region: string;
  coordinates: [number, number];
  sector: string;
  annualRevenueUsd: number;
}

export interface CaseDocument {
  id: string;
  type: string;
  status: 'pending' | 'validated' | 'failed' | 'flagged';
  completeness: number;
  uploadedAt: string;
  extractedFields: string[];
}

export interface QcRule {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'manual-review';
  rationale: string;
}

export interface OwnershipNode {
  id: string;
  name: string;
  role: string;
  group: 'client' | 'beneficial-owner' | 'advisor' | 'jurisdiction';
}

export interface OwnershipLink {
  source: string;
  target: string;
  weight: number;
}

export interface CaseRecord {
  id: string;
  clientId: string;
  caseName: string;
  priority: 'high' | 'medium' | 'low';
  stage:
    | 'intake'
    | 'classification'
    | 'quality-check'
    | 'advisor-review'
    | 'monitoring'
    | 'governance';
  status: 'in-flight' | 'exception' | 'resolved' | 'monitored';
  jurisdiction: string;
  region: string;
  riskScore: number;
  stpEligible: boolean;
  firstTimeRight: boolean;
  onboardingHours: number;
  assignedTo: string;
  completeness: number;
  documents: CaseDocument[];
  qcRules: QcRule[];
  narrative: string;
  nextBestAction: string;
  ownershipGraph: {
    nodes: OwnershipNode[];
    links: OwnershipLink[];
  };
}

export interface AgentRecord {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'exception';
  latencyMs: number;
  tasksProcessed: number;
  autoShare: number;
  manualShare: number;
  pulseMessage: string;
}

export interface ConfidenceCell {
  docType: string;
  field: string;
  confidence: number;
}

export interface MonitoringAlert {
  id: string;
  caseId: string;
  clientId: string;
  title: string;
  severity: Severity;
  region: string;
  coordinates: [number, number];
  eventTime: string;
  falsePositiveRisk: number;
  description: string;
}

export interface EvidenceSource {
  id: string;
  label: string;
  type: 'document' | 'sanctions' | 'screening' | 'advisor-note' | 'registry';
  confidence: number;
  excerpt: string;
}

export interface DecisionLog {
  id: string;
  caseId: string;
  title: string;
  actor: string;
  decision: 'approved' | 'escalated' | 'overridden' | 'flagged';
  confidence: number;
  overrideReason?: string;
  createdAt: string;
  reasoningChain: string[];
  sources: EvidenceSource[];
}

export interface TimelineEvent {
  id: string;
  timeOffsetMs: number;
  timestamp: string;
  type: TimelineEventType;
  title: string;
  description: string;
  severity: Severity;
  caseId: string;
  clientId: string;
  routeHint: DashboardRoute;
  payload?: Record<string, string | number | boolean>;
}

export interface DrillDownTarget {
  route: DashboardRoute;
  caseId?: string;
  region?: string;
  alertId?: string;
  decisionId?: string;
}

export interface NarrativeCardProps<TData> {
  data: TData;
  headline: string;
  whyItMatters: string;
  recommendedAction: string;
  onDrillDown?: (target: DrillDownTarget) => void;
}

export interface RegionPerformance {
  id: string;
  label: string;
  performance: number;
  stpRate: number;
  bubbleValue: number;
  centroid: [number, number];
}

export interface TrendPoint {
  month: string;
  nigo: number;
  stp: number;
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export interface HistogramPoint {
  bucket: string;
  count: number;
}

export interface WaterfallStep {
  label: string;
  value: number;
  cumulative: number;
  type: 'gain' | 'loss' | 'result';
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: Severity;
  routeHint: DashboardRoute;
}

export interface TaskThroughputPoint {
  agent: string;
  tasks: number;
  auto: number;
  manual: number;
}

export interface FairnessPoint {
  cohort: string;
  parity: number;
  overrides: number;
}

export interface CaseTimelineEntry {
  id: string;
  label: string;
  timestamp: string;
  status: 'pending' | 'active' | 'done' | 'issue';
  detail: string;
}
