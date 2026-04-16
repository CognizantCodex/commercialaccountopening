import * as d3 from 'd3';
import { Card } from '@/components/ui/Card';
import type { WaterfallStep } from '@/types/platform';

export function ConfidenceWaterfall({ steps }: { steps: WaterfallStep[] }) {
  const width = 520;
  const height = 280;
  const margin = { top: 24, right: 16, bottom: 50, left: 42 };
  const x = d3
    .scaleBand()
    .domain(steps.map((step) => step.label))
    .range([margin.left, width - margin.right])
    .padding(0.22);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(steps, (step) => Math.max(step.cumulative, step.value)) ?? 100])
    .nice()
    .range([height - margin.bottom, margin.top]);

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">Confidence waterfall</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-[18rem] w-full">
        {y.ticks(4).map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left}
              x2={width - margin.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--chart-grid)"
            />
            <text x={margin.left - 8} y={y(tick)} textAnchor="end" dy="0.35em" fill="var(--muted-foreground)" fontSize="11">
              {tick}
            </text>
          </g>
        ))}
        {steps.map((step) => {
          const barX = x(step.label) ?? 0;
          const barWidth = x.bandwidth();
          const startValue = step.type === 'gain' ? step.cumulative - step.value : step.cumulative;
          const endValue = step.type === 'gain' ? step.cumulative : step.cumulative + Math.abs(step.value);
          const barY = y(endValue);
          const barHeight = y(startValue) - y(endValue);
          const fill =
            step.type === 'gain'
              ? 'var(--accent)'
              : step.type === 'loss'
                ? 'var(--danger)'
                : 'var(--accent-secondary)';

          return (
            <g key={step.label}>
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                rx="12"
                fill={fill}
                opacity="0.9"
              />
              <text
                x={barX + barWidth / 2}
                y={height - 18}
                textAnchor="middle"
                fill="var(--muted-foreground)"
                fontSize="11"
              >
                {step.label}
              </text>
              <text
                x={barX + barWidth / 2}
                y={barY - 8}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="11"
              >
                {step.cumulative}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
