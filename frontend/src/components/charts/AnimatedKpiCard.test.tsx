import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { AnimatedKpiCard } from '@/components/charts/AnimatedKpiCard';

describe('AnimatedKpiCard', () => {
  it('renders the metric narrative and supports click-through', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <AnimatedKpiCard
        metric={{
          id: 'stp',
          label: 'STP Rate',
          value: 72,
          displayValue: '72%',
          delta: 4.2,
          trend: 'up',
          narrative: 'Automation is expanding.',
        }}
        onClick={onClick}
      />,
    );

    expect(screen.getByText('STP Rate')).toBeInTheDocument();
    expect(screen.getByText('Automation is expanding.')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
