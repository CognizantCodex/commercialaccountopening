import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[color:rgba(255,255,255,0.06)] text-[var(--foreground)]',
  success: 'bg-[color:rgba(46,160,67,0.16)] text-[var(--success)]',
  warning: 'bg-[color:rgba(242,204,96,0.16)] text-[var(--warning)]',
  danger: 'bg-[color:rgba(248,81,73,0.16)] text-[var(--danger)]',
  info: 'bg-[color:rgba(31,111,235,0.16)] text-[var(--accent-secondary)]',
};

export function Badge({
  children,
  className,
  variant = 'default',
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
