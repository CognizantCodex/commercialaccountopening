import { describe, expect, it } from 'vitest';
import { adaptPlatformSnapshot } from '@/services/platform-adapter';
import type { PlatformSnapshotDto } from '@/services/platform-adapter';

const snapshot: PlatformSnapshotDto = {
  data: {
    clients: [
      {
        id: 'client-live-1',
        name: 'Helios Global Markets',
        segment: 'Institutional',
        headquarters: 'London, UK',
        region: 'Europe',
        coordinates: [-0.1276, 51.5072],
        sector: 'Financial Services',
        annualRevenueUsd: 320000000,
      },
    ],
    cases: [
      {
        id: 'case-live-1',
        clientId: 'client-live-1',
        caseName: 'Helios Prime Brokerage',
        priority: 'high',
        stage: 'monitoring',
        status: 'monitored',
        jurisdiction: 'United Kingdom',
        region: 'Europe',
        riskScore: 61,
        stpEligible: true,
        firstTimeRight: true,
        onboardingHours: 14,
        assignedTo: 'Analyst Team',
        completeness: 96,
        documents: [],
        qcRules: [],
        narrative: 'Live case state from backend',
        nextBestAction: 'Continue monitoring',
        ownershipGraph: {
          nodes: [],
          links: [],
        },
      },
    ],
    timeline: [
      {
        id: 'event-live-1',
        timeOffsetMs: 0,
        timestamp: '2026-04-16T08:00:00Z',
        type: 'monitoring_alert',
        title: 'Adverse media review',
        description: 'Media screening surfaced a material change.',
        severity: 'warning',
        caseId: 'case-live-1',
        clientId: 'client-live-1',
        routeHint: 'monitoring',
      },
    ],
    monitoring: {
      alerts: [
        {
          id: 'alert-live-1',
          caseId: 'case-live-1',
          clientId: 'client-live-1',
          title: 'Media review opened',
          severity: 'warning',
          region: 'Europe',
          coordinates: [-0.1276, 51.5072],
          eventTime: '2026-04-16T08:05:00Z',
          falsePositiveRisk: 19,
          description: 'Alert carried through from backend monitoring service.',
        },
      ],
    },
    governance: {
      decisionLogs: [
        {
          id: 'decision-live-1',
          caseId: 'case-live-1',
          title: 'Escalation queued',
          actor: 'Governance Reviewer',
          decision: 'flagged',
          confidence: 82,
          createdAt: '2026-04-16T08:10:00Z',
          reasoningChain: ['Material media signal requires a documented review.'],
          sources: [],
        },
      ],
    },
    agents: {
      agents: [
        {
          id: 'agent-live-1',
          name: 'Monitoring Sentinel',
          role: 'Continuous monitoring',
          status: 'active',
          latencyMs: 184,
          tasksProcessed: 32,
          autoShare: 72,
          manualShare: 28,
          pulseMessage: 'Watching live event intake.',
        },
      ],
    },
  },
};

describe('adaptPlatformSnapshot', () => {
  it('adapts nested backend payloads into the frontend scenario shape', () => {
    const scenario = adaptPlatformSnapshot(snapshot);

    expect(scenario.clients).toHaveLength(1);
    expect(scenario.cases[0]?.id).toBe('case-live-1');
    expect(scenario.alerts[0]?.id).toBe('alert-live-1');
    expect(scenario.decisionLogs[0]?.id).toBe('decision-live-1');
    expect(scenario.agents[0]?.id).toBe('agent-live-1');
  });

  it('derives executive and monitoring aggregates when the backend omits them', () => {
    const scenario = adaptPlatformSnapshot(snapshot);

    expect(scenario.kpis).not.toHaveLength(0);
    expect(scenario.regionPerformance[0]?.label).toBe('Europe');
    expect(scenario.donutSlices.some((slice) => slice.name === 'STP Ready')).toBe(true);
    expect(scenario.riskHistogram.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(1);
  });
});
