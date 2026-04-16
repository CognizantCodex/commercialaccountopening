import * as d3 from 'd3';
import { Card } from '@/components/ui/Card';
import type { ConfidenceCell } from '@/types/platform';

export function HeatmapGrid({ data }: { data: ConfidenceCell[] }) {
  const docTypes = Array.from(new Set(data.map((item) => item.docType)));
  const fields = Array.from(new Set(data.map((item) => item.field)));
  const colorScale = d3.scaleLinear<string>().domain([45, 100]).range(['#2a313c', '#00c9b1']);

  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-[var(--foreground)]">Confidence heatmap</h3>
      <div className="mt-5 overflow-auto">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `180px repeat(${fields.length}, minmax(112px, 1fr))`,
          }}
        >
          <div />
          {fields.map((field) => (
            <div
              key={field}
              className="px-2 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
            >
              {field}
            </div>
          ))}
          {docTypes.map((docType) => (
            <div key={docType} className="contents">
              <div className="flex items-center text-sm font-medium text-[var(--foreground)]">
                {docType}
              </div>
              {fields.map((field) => {
                const cell = data.find((item) => item.docType === docType && item.field === field);
                const confidence = cell?.confidence ?? 0;
                return (
                  <div
                    key={`${docType}-${field}`}
                    className="rounded-[1.25rem] border border-[var(--border)] px-3 py-4 text-center text-sm font-medium text-white"
                    style={{ backgroundColor: colorScale(confidence) }}
                  >
                    {confidence.toFixed(0)}%
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
