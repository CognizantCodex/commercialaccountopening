import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/types/platform';

export function DualAxisTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--tooltip-bg)',
              borderColor: 'var(--tooltip-border)',
              borderRadius: 16,
            }}
          />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="nigo" name="NIGO" stroke="var(--danger)" strokeWidth={3} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="stp" name="STP" stroke="var(--accent)" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
