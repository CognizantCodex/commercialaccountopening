import { describe, expect, it } from 'vitest';
import { buildScenarioState } from '@/mock-data/adapters';
import {
  buildDecisionBrief,
  getCaseTimeline,
  getRouteByIndex,
  getSelectedCase,
  getSelectedDecision,
  toDrillDown,
} from '@/services/selectors';

describe('selectors', () => {
  it('falls back to the executive route for out-of-range indexes', () => {
    expect(getRouteByIndex(2)).toBe('cases');
    expect(getRouteByIndex(99)).toBe('executive');
  });

  it('builds a merged and chronologically sorted case timeline', () => {
    const scenario = buildScenarioState(5);
    const caseRecord = scenario.cases[0];
    const timeline = getCaseTimeline(caseRecord, scenario.timeline);

    expect(timeline.length).toBeGreaterThan(caseRecord.documents.length);
    expect(timeline[0]?.timestamp <= timeline[timeline.length - 1]?.timestamp).toBe(true);
    expect(timeline.some((entry) => entry.status === 'issue')).toBe(true);
  });

  it('selects the active case and decision with safe fallbacks', () => {
    const scenario = buildScenarioState(0);
    const state = {
      ...scenario,
      selectedCaseId: scenario.cases[0]?.id,
    } as Parameters<typeof getSelectedCase>[0];

    expect(getSelectedCase(state)?.id).toBe(scenario.cases[0]?.id);
    expect(getSelectedDecision(state)?.id).toBe(
      scenario.decisionLogs.find((decision) => decision.caseId === scenario.cases[0]?.id)?.id ??
        scenario.decisionLogs[0]?.id,
    );

    const fallbackState = {
      ...state,
      cases: [],
      selectedCaseId: null,
    } as Parameters<typeof getSelectedDecision>[0];

    expect(getSelectedCase(fallbackState)).toBeNull();
    expect(getSelectedDecision(fallbackState)?.id).toBe(scenario.decisionLogs[0]?.id);
  });

  it('builds route-specific decision briefs and drill-down targets', () => {
    const scenario = buildScenarioState(6);
    const state = {
      ...scenario,
      selectedCaseId: scenario.cases[0]?.id,
    } as Parameters<typeof buildDecisionBrief>[1];

    const caseBrief = buildDecisionBrief('cases', state);
    const governanceBrief = buildDecisionBrief('governance', state);

    expect(caseBrief.what).toContain(scenario.cases[0]?.caseName ?? '');
    expect(governanceBrief.why).toContain('Audit-ready reasoning');
    expect(toDrillDown('monitoring', 'case-1')).toEqual({
      route: 'monitoring',
      caseId: 'case-1',
    });
  });
});
