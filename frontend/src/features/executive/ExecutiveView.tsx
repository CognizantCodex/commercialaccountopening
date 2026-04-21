import { ArrowRight, Globe2, ShieldCheck, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatedKpiCard } from '@/components/charts/AnimatedKpiCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { DualAxisTrendChart } from '@/components/charts/DualAxisTrendChart';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import { D3WorldMap } from '@/components/maps/D3WorldMap';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { routeCatalog } from '@/services/selectors';
import { usePlatformStore } from '@/store';

export function ExecutiveView() {
  const navigate = useNavigate();
  const dataSource = usePlatformStore((state) => state.dataSource);
  const hydrationStatus = usePlatformStore((state) => state.hydrationStatus);
  const loadError = usePlatformStore((state) => state.loadError);
  const refreshPlatform = usePlatformStore((state) => state.refreshPlatform);
  const kpis = usePlatformStore((state) => state.kpis);
  const regionPerformance = usePlatformStore((state) => state.regionPerformance);
  const trendSeries = usePlatformStore((state) => state.trendSeries);
  const donutSlices = usePlatformStore((state) => state.donutSlices);
  const focusRegion = usePlatformStore((state) => state.focusRegion);

  if (dataSource === 'live' && hydrationStatus === 'loading') {
    return (
      <div className="grid gap-6">
        <section className="grid gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={`executive-kpi-${index}`} className="h-28 rounded-[1.75rem]" />
          ))}
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <LoadingSkeleton className="h-[34rem] rounded-[1.75rem]" />
          <LoadingSkeleton className="h-[34rem] rounded-[1.75rem]" />
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <LoadingSkeleton className="h-80 rounded-[1.75rem]" />
          <LoadingSkeleton className="h-72 rounded-[1.75rem]" />
        </section>
      </div>
    );
  }

  if (dataSource === 'live' && hydrationStatus === 'error') {
    return (
      <Card>
        <Badge variant="warning">Live snapshot unavailable</Badge>
        <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
          Executive metrics are waiting for a clean live refresh
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          {loadError ?? 'The executive dashboard could not load the latest live portfolio snapshot.'}
        </p>
        <Button className="mt-4" onClick={() => void refreshPlatform()}>
          Refresh live data
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 xl:grid-cols-5">
        {kpis.map((metric) => (
          <AnimatedKpiCard
            key={metric.id}
            metric={metric}
            onClick={() => {
              if (!metric.route) {
                return;
              }
              void navigate(routeCatalog[metric.route].path);
            }}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <Card className="min-w-0 overflow-hidden">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Badge variant="info">Global business impact</Badge>
              <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
                Regional straight-through onboarding momentum
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                The operating model is visibly shifting: exception handling is narrowing while STP performance is spreading across regions.
              </p>
            </div>
            <Globe2 className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <D3WorldMap
            regions={regionPerformance}
            mode="performance"
            onRegionSelect={(region) => {
              focusRegion(region);
              void navigate(routeCatalog.monitoring.path);
            }}
          />
        </Card>

        <Card className="h-full min-w-0">
          <Badge variant="success">Board actions</Badge>
          <div className="mt-4 space-y-4">
            {[
              {
                title: 'Scale the AI operating model',
                description: 'STP is rising without hiding risk, which is the strongest signal to expand automation coverage.',
                icon: TrendingUp,
              },
              {
                title: 'Protect exception capacity',
                description: 'Only a small number of policy-critical cases now demand human attention, so analyst effort can be redirected to quality.',
                icon: ShieldCheck,
              },
              {
                title: 'Connect onboarding to monitoring',
                description: 'The value narrative no longer ends at approval; continuous KYC creates a live compliance command loop.',
                icon: ArrowRight,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-[var(--accent)]" />
                  <h4 className="font-medium text-[var(--foreground)]">{item.title}</h4>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <Card className="min-w-0">
          <Badge variant="default">Trend narrative</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            NIGO down, STP up
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            AI assistance is collapsing avoidable rework and making the operational curve easier to govern at scale.
          </p>
          <div className="mt-4 min-w-0">
            <DualAxisTrendChart data={trendSeries} />
          </div>
        </Card>
        <Card className="min-w-0">
          <Badge variant="default">Portfolio composition</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            STP versus exceptions
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Exceptions still exist, but they are becoming more surgical and more explainable.
          </p>
          <div className="min-w-0">
            <DonutChart data={donutSlices} centerLabel="Active portfolio" />
          </div>
        </Card>
      </section>
    </div>
  );
}
