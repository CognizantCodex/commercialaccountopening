import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const dotColor = {
  active: 'bg-[var(--accent)]',
  idle: 'bg-[var(--muted-foreground)]',
  exception: 'bg-[var(--danger)]',
};

export function PulseDot({
  state,
  className,
}: {
  state: 'active' | 'idle' | 'exception';
  className?: string;
}) {
  return (
    <span className={cn('relative flex h-3 w-3', className)}>
      <motion.span
        className={cn('absolute inline-flex h-full w-full rounded-full opacity-70', dotColor[state])}
        animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className={cn('relative inline-flex h-3 w-3 rounded-full', dotColor[state])} />
    </span>
  );
}
