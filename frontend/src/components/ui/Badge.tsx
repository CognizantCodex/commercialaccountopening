import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--surface-muted)] text-[var(--foreground)]',
  success: 'bg-[var(--surface-success)] text-[var(--success)]',
  warning: 'bg-[var(--surface-warning)] text-[var(--warning)]',
  danger: 'bg-[var(--surface-danger)] text-[var(--danger)]',
  info: 'bg-[var(--surface-info)] text-[var(--accent-secondary)]',
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
