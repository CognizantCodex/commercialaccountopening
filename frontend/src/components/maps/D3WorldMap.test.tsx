import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { D3WorldMap } from '@/components/maps/D3WorldMap';

describe('D3WorldMap', () => {
  it('renders regional shapes and alert overlays', () => {
    const { container } = renderWithProviders(
      <D3WorldMap
        regions={[
          {
            id: 'na',
            label: 'North America',
            performance: 88,
            stpRate: 74,
            bubbleValue: 40,
            centroid: [-74, 40],
          },
        ]}
        alerts={[
          {
            id: 'alert-1',
            caseId: 'case-aurora-001',
            clientId: 'client-aurora',
            title: 'Alert',
            severity: 'critical',
            region: 'Europe',
            coordinates: [-0.12, 51.5],
            eventTime: '2026-04-16T09:00:00Z',
            falsePositiveRisk: 14,
            description: 'Alert description',
          },
        ]}
      />,
    );

    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });
});
