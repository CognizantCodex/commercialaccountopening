import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TaskThroughputPoint } from '@/types/platform';

export function TaskThroughputChart({ data }: { data: TaskThroughputPoint[] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="agent" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--tooltip-bg)',
              borderColor: 'var(--tooltip-border)',
              borderRadius: 16,
            }}
          />
          <Legend />
          <Bar dataKey="tasks" name="Tasks" fill="var(--accent-secondary)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="auto" name="Auto %" fill="var(--accent)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="manual" name="Manual %" fill="var(--warning)" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
