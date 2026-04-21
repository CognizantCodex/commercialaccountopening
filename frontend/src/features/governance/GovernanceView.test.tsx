import { beforeEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GovernanceView } from '@/features/governance/GovernanceView';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('GovernanceView', () => {
  beforeEach(() => {
    resetStore();
    usePlatformStore.setState({ currentRoute: 'governance' });
  });

  it('renders the explainability console and lets analysts focus a decision row', async () => {
    const user = userEvent.setup();
    const selectedDecision =
      usePlatformStore.getState().decisionLogs.find((decision) => decision.overrideReason) ??
      usePlatformStore.getState().decisionLogs[0];

    usePlatformStore.setState({ selectedCaseId: selectedDecision?.caseId ?? null });

    renderWithProviders(
      <MemoryRouter>
        <GovernanceView />
      </MemoryRouter>,
    );

    expect(screen.getByText('AI and human decisions, ready for audit')).toBeInTheDocument();
    expect(screen.getByText('Confidence waterfall')).toBeInTheDocument();
    expect(screen.getByText(selectedDecision.reasoningChain[0])).toBeInTheDocument();

    await user.click(screen.getByText(selectedDecision.title));

    expect(usePlatformStore.getState().selectedCaseId).toBe(selectedDecision.caseId);

    if (selectedDecision.overrideReason) {
      expect(screen.getByText(selectedDecision.overrideReason)).toBeInTheDocument();
    }
  });

  it('returns nothing when no governance decisions are available', () => {
    usePlatformStore.setState({
      decisionLogs: [],
      cases: [],
      selectedCaseId: null,
    });

    const { container } = renderWithProviders(
      <MemoryRouter>
        <GovernanceView />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
