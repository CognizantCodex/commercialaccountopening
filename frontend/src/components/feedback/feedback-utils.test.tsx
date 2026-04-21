import { describe, expect, it } from 'vitest';
import { AnimatedPage } from '@/components/animations/AnimatedPage';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton';
import {
  clamp,
  cn,
  formatCompactNumber,
  formatDelta,
  formatHours,
  formatMs,
  formatPercent,
} from '@/lib/utils';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('feedback and utility helpers', () => {
  it('renders shared feedback primitives', () => {
    renderWithProviders(
      <>
        <AnimatedPage>
          <span>Animated child</span>
        </AnimatedPage>
        <LoadingSkeleton className="custom-class" />
        <EmptyState title="No cases" description="Everything is clear." />
      </>,
    );

    expect(screen.getByText('Animated child')).toBeInTheDocument();
    expect(screen.getByText('No cases')).toBeInTheDocument();
    expect(screen.getByText('Everything is clear.')).toBeInTheDocument();
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('formats numbers and class names for the shared UI toolkit', () => {
    expect(cn('alpha', false && 'beta', 'gamma')).toContain('alpha');
    expect(clamp(12, 0, 10)).toBe(10);
    expect(formatPercent(88.2, 1)).toBe('88.2%');
    expect(formatDelta(2.3)).toBe('+2.3%');
    expect(formatHours(3)).toBe('3.0 hrs');
    expect(formatMs(10.4)).toBe('10 ms');
    expect(formatCompactNumber(12500)).toMatch(/12\.5K/i);
  });
});
