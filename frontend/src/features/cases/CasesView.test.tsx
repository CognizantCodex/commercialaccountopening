import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CasesView } from '@/features/cases/CasesView';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('CasesView', () => {
  beforeEach(() => {
    resetStore();
    usePlatformStore.setState({
      currentRoute: 'cases',
      currentStep: 5,
      selectedCaseId: usePlatformStore.getState().cases[0]?.id ?? null,
    });
  });

  it('filters the case rail and lets analysts switch the selected case', async () => {
    const user = userEvent.setup();
    const [firstCase, secondCase] = usePlatformStore.getState().cases;

    renderWithProviders(
      <MemoryRouter>
        <CasesView />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: firstCase.caseName })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/search cases or jurisdictions/i), secondCase.caseName);
    await user.click(screen.getAllByRole('button', { name: new RegExp(secondCase.status, 'i') })[0]);
    await user.click(screen.getByRole('button', { name: new RegExp(secondCase.caseName, 'i') }));

    expect(screen.getByRole('heading', { name: secondCase.caseName })).toBeInTheDocument();
  });

  it('dispatches workflow actions and navigates to governance from the same workspace', async () => {
    const user = userEvent.setup();
    const runCaseWorkflowAction = vi.fn().mockResolvedValue(undefined);
    const selectedCaseId = usePlatformStore.getState().cases[0]?.id ?? '';

    usePlatformStore.setState({
      dataSource: 'live',
      runCaseWorkflowAction,
      selectedCaseId,
    });

    renderWithProviders(
      <MemoryRouter initialEntries={['/cases']}>
        <Routes>
          <Route path="/cases" element={<CasesView />} />
          <Route path="/governance" element={<div>Governance destination</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Apply resolution' }));
    await user.click(screen.getByRole('button', { name: 'Start monitoring' }));
    await user.click(screen.getByRole('button', { name: 'Open governance' }));

    expect(runCaseWorkflowAction).toHaveBeenNthCalledWith(1, 'resolve', selectedCaseId);
    expect(runCaseWorkflowAction).toHaveBeenNthCalledWith(2, 'start-monitoring', selectedCaseId);
    expect(runCaseWorkflowAction).toHaveBeenNthCalledWith(3, 'open-governance', selectedCaseId);
    expect(await screen.findByText('Governance destination')).toBeInTheDocument();
  });
});
