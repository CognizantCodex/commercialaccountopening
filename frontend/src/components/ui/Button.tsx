import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'icon';

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--brand-gradient)] text-white border-transparent shadow-[var(--shadow-soft)]',
  secondary:
    'bg-[var(--surface-strong)] text-[var(--foreground)] border-[var(--border-strong)]',
  ghost:
    'bg-transparent text-[var(--muted-foreground)] border-transparent hover:text-[var(--foreground)]',
};

const sizeClassName: Record<ButtonSize, string> = {
  default: 'px-4 py-2.5 text-sm',
  icon: 'h-11 w-11 justify-center p-0',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'default',
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60',
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
