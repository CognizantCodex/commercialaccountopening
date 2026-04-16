import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/animations/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { KpiMetric } from '@/types/platform';

function getSuffix(displayValue: string) {
  if (displayValue.endsWith('%')) {
    return '%';
  }
  if (displayValue.endsWith(' hrs')) {
    return ' hrs';
  }
  return '';
}

export function AnimatedKpiCard({
  metric,
  onClick,
}: {
  metric: KpiMetric;
  onClick?: () => void;
}) {
  const TrendIcon =
    metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : Minus;
  const deltaVariant =
    metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'warning' : 'default';
  const suffix = getSuffix(metric.displayValue);

  return (
    <motion.div layout whileHover={{ y: -3 }}>
      <Card
        className="h-full cursor-pointer"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(event) => {
          if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">{metric.label}</p>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              <AnimatedNumber
                value={metric.value}
                suffix={suffix}
                formatter={(value) =>
                  suffix === ' hrs'
                    ? Number(value).toFixed(1)
                    : Math.round(Number(value)).toString()
                }
              />
            </div>
          </div>
          {metric.delta !== undefined && (
            <Badge variant={deltaVariant}>
              <TrendIcon className="h-3.5 w-3.5" />
              {metric.delta > 0 ? '+' : ''}
              {metric.delta.toFixed(1)}%
            </Badge>
          )}
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{metric.narrative}</p>
        {metric.deltaLabel && (
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            {metric.deltaLabel}
          </p>
        )}
      </Card>
    </motion.div>
  );
}
