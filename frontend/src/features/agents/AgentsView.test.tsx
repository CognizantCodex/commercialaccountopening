import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AgentsView } from '@/features/agents/AgentsView';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('AgentsView', () => {
  beforeEach(() => {
    usePlatformStore.getState().resetTimeline();
    usePlatformStore.setState({
      commandPaletteOpen: false,
      currentRoute: 'agents',
      dataSource: 'demo',
      focusedCaseId: null,
      focusedRegion: null,
      themeMode: 'dark',
    });
  });

  it('supports drilling into an agent and running its scripted demo step', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter>
        <AgentsView />
      </MemoryRouter>,
    );

    const monitoringButton = screen.getByRole('button', { name: /monitoring sentinel/i });
    await user.click(monitoringButton);

    expect(monitoringButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Sample demo implementation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run monitoring sample' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Run monitoring sample' }));

    expect(usePlatformStore.getState().currentStep).toBe(5);
    expect(usePlatformStore.getState().alerts[0]?.title).toBe('Continuous KYC alert triggered in London');
    expect(screen.getByRole('button', { name: 'Sample already applied' })).toBeDisabled();
  });
});
