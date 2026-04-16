import * as d3 from 'd3';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import worldGeoJson from '@/assets/world.geo.json';
import type { MonitoringAlert, RegionPerformance } from '@/types/platform';

type WorldFeature = GeoJSON.Feature<Geometry, GeoJsonProperties>;

export function D3WorldMap({
  regions,
  alerts = [],
  selectedRegion,
  mode = 'performance',
  height = 420,
  onRegionSelect,
  onAlertSelect,
}: {
  regions: RegionPerformance[];
  alerts?: MonitoringAlert[];
  selectedRegion?: string | null;
  mode?: 'performance' | 'monitoring';
  height?: number;
  onRegionSelect?: (region: string) => void;
  onAlertSelect?: (alert: MonitoringAlert) => void;
}) {
  const width = 860;
  const featureCollection = worldGeoJson as FeatureCollection;
  const projection = d3.geoMercator().fitSize([width, height], featureCollection);
  const path = d3.geoPath(projection);
  const performanceLookup = new Map(regions.map((region) => [region.label, region]));
  const fillScale = d3.scaleLinear<string>().domain([50, 100]).range(['#1b2430', '#00c9b1']);

  return (
    <div className="w-full overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.02)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <radialGradient id="alert-pulse">
            <stop offset="0%" stopColor="rgba(248,81,73,0.9)" />
            <stop offset="100%" stopColor="rgba(248,81,73,0)" />
          </radialGradient>
        </defs>
        {(featureCollection.features as WorldFeature[]).map((feature) => {
          const regionName = String(feature.properties?.name ?? '');
          const performance = performanceLookup.get(regionName);
          const alertCount = alerts.filter((alert) => alert.region === regionName).length;
          const fill =
            mode === 'monitoring' && alertCount > 0
              ? 'rgba(248,81,73,0.28)'
              : fillScale(performance?.performance ?? 48);
          return (
            <path
              key={regionName}
              d={path(feature) ?? ''}
              fill={fill}
              stroke={selectedRegion === regionName ? 'var(--accent)' : 'rgba(255,255,255,0.12)'}
              strokeWidth={selectedRegion === regionName ? 2.5 : 1}
              onClick={() => onRegionSelect?.(regionName)}
              className="cursor-pointer transition-opacity hover:opacity-90"
            />
          );
        })}
        {mode === 'performance' &&
          regions.map((region) => {
            const point = projection(region.centroid);
            if (!point) {
              return null;
            }
            return (
              <g key={region.id} transform={`translate(${point[0]}, ${point[1]})`}>
                <circle
                  r={region.bubbleValue / 6}
                  fill="rgba(31,111,235,0.22)"
                  stroke="rgba(31,111,235,0.58)"
                />
                <circle r={12} fill="var(--accent-secondary)" opacity="0.8" />
                <text
                  y={4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                >
                  {Math.round(region.stpRate)}%
                </text>
              </g>
            );
          })}
        {alerts.map((alert) => {
          const point = projection(alert.coordinates);
          if (!point) {
            return null;
          }
          return (
            <g
              key={alert.id}
              transform={`translate(${point[0]}, ${point[1]})`}
              onClick={() => onAlertSelect?.(alert)}
              className="cursor-pointer"
            >
              <circle r="28" fill="url(#alert-pulse)">
                <animate attributeName="r" values="14;30;14" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <circle r="7" fill={alert.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
