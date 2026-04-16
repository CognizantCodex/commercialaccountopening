import { describe, expect, it } from 'vitest';
import { buildScenarioState } from '@/mock-data/adapters';

describe('buildScenarioState', () => {
  it('returns the opening storyline before any events are applied', () => {
    const scenario = buildScenarioState(0);
    const auroraCase = scenario.cases.find((record) => record.id === 'case-aurora-001');

    expect(auroraCase?.stage).toBe('intake');
    expect(scenario.alerts).toHaveLength(1);
    expect(scenario.decisionLogs[0]?.id).toBe('decision-lattice-001');
  });

  it('applies the full scripted journey through governance', () => {
    const scenario = buildScenarioState(6);
    const auroraCase = scenario.cases.find((record) => record.id === 'case-aurora-001');
    const auroraDecision = scenario.decisionLogs.find((decision) => decision.caseId === 'case-aurora-001');

    expect(auroraCase?.stage).toBe('governance');
    expect(auroraCase?.status).toBe('monitored');
    expect(scenario.alerts.some((alert) => alert.caseId === 'case-aurora-001')).toBe(true);
    expect(auroraDecision?.decision).toBe('flagged');
  });
});
