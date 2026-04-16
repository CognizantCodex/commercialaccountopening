import type { StateCreator } from 'zustand';
import type {
  ActivityItem,
  AgentRecord,
  CaseRecord,
  ClientRecord,
  ConfidenceCell,
  DataSourceMode,
  DashboardRoute,
  DecisionLog,
  DemoMode,
  DonutSlice,
  FairnessPoint,
  HistogramPoint,
  KpiMetric,
  MonitoringAlert,
  RegionPerformance,
  TaskThroughputPoint,
  ThemeMode,
  TimelineEvent,
  TrendPoint,
} from '@/types/platform';

export interface AppSlice {
  currentRoute: DashboardRoute;
  focusedCaseId: string | null;
  focusedRegion: string | null;
  commandPaletteOpen: boolean;
  themeMode: ThemeMode;
  navigateToView: (route: DashboardRoute) => void;
  focusCase: (caseId: string | null) => void;
  focusRegion: (region: string | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

export type PlatformLoadState = 'idle' | 'loading' | 'ready' | 'error';

export type CaseWorkflowAction = 'resolve' | 'start-monitoring' | 'open-governance';

export interface IntegrationSlice {
  dataSource: DataSourceMode;
  hydrationStatus: PlatformLoadState;
  loadError: string | null;
  lastSyncAt: string | null;
  activeMutation:
    | {
        action: CaseWorkflowAction;
        caseId: string;
      }
    | null;
  initializePlatform: () => Promise<void>;
  refreshPlatform: () => Promise<void>;
  setDataSource: (mode: DataSourceMode) => void;
  runCaseWorkflowAction: (action: CaseWorkflowAction, caseId: string) => Promise<void>;
}

export interface MetricsSlice {
  kpis: KpiMetric[];
  regionPerformance: RegionPerformance[];
  trendSeries: TrendPoint[];
  donutSlices: DonutSlice[];
}

export interface AgentsSlice {
  agents: AgentRecord[];
  activityFeed: ActivityItem[];
  confidenceMatrix: ConfidenceCell[];
  taskThroughput: TaskThroughputPoint[];
}

export interface CasesSlice {
  clients: ClientRecord[];
  cases: CaseRecord[];
  selectedCaseId: string | null;
  selectCase: (caseId: string | null) => void;
}

export interface MonitoringSlice {
  alerts: MonitoringAlert[];
  falsePositiveGauge: number;
  riskHistogram: HistogramPoint[];
}

export interface GovernanceSlice {
  decisionLogs: DecisionLog[];
  fairnessSeries: FairnessPoint[];
  humanOverrideRate: number;
}

export interface SimulationSlice {
  timeline: TimelineEvent[];
  mode: DemoMode;
  autoplay: boolean;
  speedMultiplier: number;
  currentStep: number;
  setDemoMode: (mode: DemoMode) => void;
  toggleAutoplay: () => void;
  setSpeedMultiplier: (value: number) => void;
  stepTimeline: () => void;
  resetTimeline: () => void;
  applyTimelineEvent: (event: TimelineEvent) => void;
  syncScenario: (step: number) => void;
}

export type PlatformStore = AppSlice &
  IntegrationSlice &
  MetricsSlice &
  AgentsSlice &
  CasesSlice &
  MonitoringSlice &
  GovernanceSlice &
  SimulationSlice;

export type PlatformSliceCreator<TSlice> = StateCreator<PlatformStore, [], [], TSlice>;
