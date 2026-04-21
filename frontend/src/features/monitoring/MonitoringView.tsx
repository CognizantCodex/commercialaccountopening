import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { LiveActivityFeed } from '@/components/charts/LiveActivityFeed';
import { D3WorldMap } from '@/components/maps/D3WorldMap';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { routeCatalog } from '@/services/selectors';
import { usePlatformStore } from '@/store';

export function MonitoringView() {
  const navigate = useNavigate();
  const alerts = usePlatformStore((state) => state.alerts);
  const regionPerformance = usePlatformStore((state) => state.regionPerformance);
  const falsePositiveGauge = usePlatformStore((state) => state.falsePositiveGauge);
  const riskHistogram = usePlatformStore((state) => state.riskHistogram);
  const activityFeed = usePlatformStore((state) => state.activityFeed);
  const selectCase = usePlatformStore((state) => state.selectCase);
  const focusRegion = usePlatformStore((state) => state.focusRegion);
  const monitoringActivityFeed = useMemo(
    () =>
      activityFeed.filter((item) => item.routeHint === 'monitoring' || item.severity === 'critical'),
    [activityFeed],
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <Card className="overflow-hidden">
          <Badge variant="danger">Real-time monitoring</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Continuous KYC pulse map
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Once onboarding is complete, the platform keeps listening for risk changes and surfaces them with location-aware urgency.
          </p>
          <div className="mt-4">
            <D3WorldMap
              regions={regionPerformance}
              alerts={alerts}
              mode="monitoring"
              height={500}
              onRegionSelect={(region) => focusRegion(region)}
              onAlertSelect={(alert) => {
                selectCase(alert.caseId);
                void navigate(routeCatalog.cases.path);
              }}
            />
          </div>
        </Card>
        <LiveActivityFeed
          items={monitoringActivityFeed.length > 0 ? monitoringActivityFeed : activityFeed}
          title="Monitoring event stream"
          onSelect={(item) => {
            void navigate(routeCatalog[item.routeHint].path);
          }}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.7fr_0.7fr]">
        <Card>
          <Badge variant="default">Risk distribution</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Alert severity distribution
          </h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskHistogram}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="bucket" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--tooltip-bg)',
                    borderColor: 'var(--tooltip-border)',
                    borderRadius: 16,
                  }}
                />
                <Bar dataKey="count" fill="var(--accent-secondary)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <Badge variant="warning">Signal quality</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            False positive gauge
          </h3>
          <GaugeChart value={falsePositiveGauge} label="False positives" />
        </Card>
        <Card>
          <Badge variant="info">Active alerts</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            Regions demanding action
          </h3>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className="w-full rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition-colors hover:bg-[var(--surface-hover)]"
                onClick={() => {
                  selectCase(alert.caseId);
                  void navigate(routeCatalog.cases.path);
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-[var(--foreground)]">{alert.title}</div>
                  <Badge variant={alert.severity === 'critical' ? 'danger' : 'warning'}>
                    {alert.severity}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {alert.description}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
