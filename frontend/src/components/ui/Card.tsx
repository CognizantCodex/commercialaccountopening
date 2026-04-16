import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <section
      className={cn(
        'glass-panel rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-[var(--shadow-card)]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
