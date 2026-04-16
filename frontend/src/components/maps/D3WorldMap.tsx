import * as d3 from 'd3';
import type { GeoJsonProperties, Geometry } from 'geojson';
import countriesTopologyJson from 'world-atlas/countries-110m.json';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import type { MonitoringAlert, RegionPerformance } from '@/types/platform';

type CountryProperties = GeoJsonProperties & { name?: string };
type CountryFeature = GeoJSON.Feature<Geometry, CountryProperties>;
type BusinessRegion = RegionPerformance['label'];
type WorldTopology = Topology<{
  countries: GeometryCollection<CountryProperties>;
  land: GeometryCollection<CountryProperties>;
}>;

const worldTopology = countriesTopologyJson as WorldTopology;
const worldCountries = feature(
  worldTopology,
  worldTopology.objects.countries,
);
const worldCountryBorders = mesh(
  worldTopology,
  worldTopology.objects.countries,
  (left, right) => left !== right,
);
const graticule = d3.geoGraticule10();

const COUNTRY_REGION_OVERRIDES: Partial<Record<string, BusinessRegion>> = {
  Armenia: 'Middle East',
  Azerbaijan: 'Middle East',
  Bahrain: 'Middle East',
  Cyprus: 'Middle East',
  Egypt: 'Middle East',
  Georgia: 'Middle East',
  Iran: 'Middle East',
  Iraq: 'Middle East',
  Israel: 'Middle East',
  Jordan: 'Middle East',
  Kuwait: 'Middle East',
  Lebanon: 'Middle East',
  Oman: 'Middle East',
  Palestine: 'Middle East',
  Qatar: 'Middle East',
  'Saudi Arabia': 'Middle East',
  Syria: 'Middle East',
  Turkey: 'Middle East',
  'United Arab Emirates': 'Middle East',
  Yemen: 'Middle East',
  Greenland: 'North America',
  Iceland: 'Europe',
  Kazakhstan: 'APAC',
  Russia: 'Europe',
};

function resolveBusinessRegion(featureShape: CountryFeature): BusinessRegion | null {
  const countryName = String(featureShape.properties?.name ?? '');
  const overriddenRegion = COUNTRY_REGION_OVERRIDES[countryName];
  if (overriddenRegion) {
    return overriddenRegion;
  }

  const [longitude, latitude] = d3.geoCentroid(featureShape);

  if (latitude < -60) {
    return null;
  }

  if (longitude <= -52 && latitude >= 12) {
    return 'North America';
  }

  if (longitude <= -30 && latitude < 25) {
    return 'Latin America';
  }

  if (longitude >= -25 && longitude <= 45 && latitude >= 35) {
    return 'Europe';
  }

  if (longitude >= 24 && longitude <= 65 && latitude >= 10 && latitude <= 42) {
    return 'Middle East';
  }

  if (longitude >= 60) {
    return 'APAC';
  }

  return null;
}

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
  const projection = d3
    .geoNaturalEarth1()
    .fitExtent(
      [
        [18, 20],
        [width - 18, height - 20],
      ],
      worldCountries,
    );
  const path = d3.geoPath(projection);
  const performanceLookup = new Map(regions.map((region) => [region.label, region]));
  const alertLookup = alerts.reduce<Map<string, number>>((lookup, alert) => {
    lookup.set(alert.region, (lookup.get(alert.region) ?? 0) + 1);
    return lookup;
  }, new Map<string, number>());
  const fillScale = d3.scaleLinear<string>().domain([55, 100]).range(['#1b2430', '#00c9b1']);
  const alertScale = d3
    .scaleLinear<string>()
    .domain([0, 3])
    .range(['rgba(36, 42, 53, 0.96)', 'rgba(248, 81, 73, 0.72)']);

  return (
    <div className="w-full overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[color:rgba(255,255,255,0.02)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="map-ocean" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(12, 26, 42, 0.96)" />
            <stop offset="52%" stopColor="rgba(10, 46, 60, 0.94)" />
            <stop offset="100%" stopColor="rgba(9, 21, 35, 0.98)" />
          </linearGradient>
          <radialGradient id="map-glow" cx="52%" cy="48%" r="56%">
            <stop offset="0%" stopColor="rgba(0, 201, 177, 0.18)" />
            <stop offset="100%" stopColor="rgba(0, 201, 177, 0)" />
          </radialGradient>
          <radialGradient id="alert-pulse">
            <stop offset="0%" stopColor="rgba(248,81,73,0.9)" />
            <stop offset="100%" stopColor="rgba(248,81,73,0)" />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#map-ocean)" />
        <rect width={width} height={height} fill="url(#map-glow)" />
        <path d={path(graticule) ?? ''} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={0.8} />
        {worldCountries.features.map((featureShape) => {
          const countryName = String(featureShape.properties?.name ?? '');
          const regionName = resolveBusinessRegion(featureShape);
          const performance = regionName ? performanceLookup.get(regionName) : undefined;
          const alertCount = regionName ? (alertLookup.get(regionName) ?? 0) : 0;
          const isSelected = regionName !== null && selectedRegion === regionName;
          const fill =
            mode === 'monitoring' && alertCount > 0
              ? alertScale(Math.min(alertCount, 3))
              : performance
                ? fillScale(performance.performance)
                : 'rgba(52, 63, 78, 0.72)';
          return (
            <path
              key={countryName}
              d={path(featureShape) ?? ''}
              fill={fill}
              stroke={isSelected ? 'rgba(240, 246, 252, 0.85)' : 'rgba(255,255,255,0.1)'}
              strokeWidth={isSelected ? 1.5 : 0.7}
              onClick={() => {
                if (regionName) {
                  onRegionSelect?.(regionName);
                }
              }}
              className={regionName ? 'cursor-pointer transition-opacity hover:opacity-90' : undefined}
            >
              <title>{regionName ? `${countryName} • ${regionName}` : countryName}</title>
            </path>
          );
        })}
        <path
          d={path(worldCountryBorders) ?? ''}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeLinejoin="round"
          strokeWidth={0.65}
          pointerEvents="none"
        />
        {mode === 'performance' &&
          regions.map((region) => {
            const point = projection(region.centroid);
            if (!point) {
              return null;
            }
            const isSelected = selectedRegion === region.label;
            return (
              <g key={region.id} transform={`translate(${point[0]}, ${point[1]})`} pointerEvents="none">
                <circle
                  r={Math.max(region.bubbleValue / 6, 18)}
                  fill={isSelected ? 'rgba(31,111,235,0.34)' : 'rgba(31,111,235,0.22)'}
                  stroke={isSelected ? 'rgba(255,255,255,0.72)' : 'rgba(31,111,235,0.58)'}
                  strokeWidth={isSelected ? 1.6 : 1}
                />
                <circle r={14} fill="var(--accent-secondary)" opacity="0.92" />
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
