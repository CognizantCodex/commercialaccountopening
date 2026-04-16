import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DonutSlice } from '@/types/platform';

export function DonutChart({
  data,
  centerLabel,
}: {
  data: DonutSlice[];
  centerLabel?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={3}
            stroke="transparent"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--tooltip-bg)',
              borderColor: 'var(--tooltip-border)',
              borderRadius: 16,
            }}
          />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)">
            <tspan x="50%" dy="-0.2em" fontSize="14" fill="var(--muted-foreground)">
              {centerLabel ?? 'Coverage'}
            </tspan>
            <tspan x="50%" dy="1.6em" fontSize="26" fontWeight="600">
              {total}
            </tspan>
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
