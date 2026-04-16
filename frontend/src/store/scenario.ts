import type { ScenarioState } from '@/mock-data/adapters';
import type { CaseWorkflowAction, PlatformStore } from '@/store/types';
import type { TimelineEvent } from '@/types/platform';

const workflowEventType: Record<CaseWorkflowAction, TimelineEvent['type']> = {
  resolve: 'advisor_resolved',
  'start-monitoring': 'monitoring_alert',
  'open-governance': 'governance_logged',
};

function getPreferredCaseId(cases: PlatformStore['cases'], preferredCaseId: string | null) {
  if (preferredCaseId && cases.some((record) => record.id === preferredCaseId)) {
    return preferredCaseId;
  }

  return cases[0]?.id ?? null;
}

export function createScenarioPatch(
  scenario: ScenarioState,
  currentState: Pick<PlatformStore, 'selectedCaseId' | 'focusedCaseId'>,
  overrides: Partial<Pick<PlatformStore, 'currentStep' | 'autoplay'>> = {},
): Partial<PlatformStore> {
  const nextSelectedCaseId = getPreferredCaseId(
    scenario.cases,
    currentState.selectedCaseId ?? currentState.focusedCaseId,
  );

  return {
    clients: scenario.clients,
    cases: scenario.cases,
    kpis: scenario.kpis,
    regionPerformance: scenario.regionPerformance,
    trendSeries: scenario.trendSeries,
    donutSlices: scenario.donutSlices,
    agents: scenario.agents,
    activityFeed: scenario.activityFeed,
    confidenceMatrix: scenario.confidenceMatrix,
    taskThroughput: scenario.taskThroughput,
    alerts: scenario.alerts,
    falsePositiveGauge: scenario.falsePositiveGauge,
    riskHistogram: scenario.riskHistogram,
    decisionLogs: scenario.decisionLogs,
    fairnessSeries: scenario.fairnessSeries,
    humanOverrideRate: scenario.humanOverrideRate,
    timeline: scenario.timeline,
    selectedCaseId: nextSelectedCaseId,
    focusedCaseId: nextSelectedCaseId,
    ...(overrides.currentStep !== undefined ? { currentStep: overrides.currentStep } : {}),
    ...(overrides.autoplay !== undefined ? { autoplay: overrides.autoplay } : {}),
  };
}

export function findWorkflowEvent(
  timeline: TimelineEvent[],
  action: CaseWorkflowAction,
  caseId: string,
) {
  return (
    timeline.find(
      (event) => event.type === workflowEventType[action] && event.caseId === caseId,
    ) ?? timeline.find((event) => event.type === workflowEventType[action])
  );
}
