import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

export function GaugeChart({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="65%"
          innerRadius="56%"
          outerRadius="100%"
          barSize={18}
          data={[
            {
              name: label,
              value,
              fill: 'url(#gauge-gradient)',
            },
          ]}
          startAngle={210}
          endAngle={-30}
        >
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>
          <RadialBar dataKey="value" cornerRadius={999} background={{ fill: 'rgba(255,255,255,0.06)' }} />
          <text x="50%" y="55%" textAnchor="middle" fill="var(--foreground)" fontSize="28" fontWeight="600">
            {value.toFixed(1)}%
          </text>
          <text x="50%" y="68%" textAnchor="middle" fill="var(--muted-foreground)" fontSize="13">
            {label}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
