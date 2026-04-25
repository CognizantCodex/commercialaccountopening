import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/layout/AppShell';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

function resetStore() {
  usePlatformStore.setState(usePlatformStore.getInitialState(), true);
}

describe('AppShell', () => {
  beforeEach(() => {
    resetStore();
    usePlatformStore.setState({
      currentRoute: 'executive',
      selectedCaseId: usePlatformStore.getState().cases[0]?.id ?? null,
      setCommandPaletteOpen: vi.fn(),
      themeMode: 'system',
      dataSource: 'demo',
    });
  });

  it('synchronizes route state, title, and shared shell chrome for the KYC workspace', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <MemoryRouter initialEntries={['/kyc-fabric/cases']}>
        <Routes>
          <Route path="/kyc-fabric" element={<AppShell />}>
            <Route path="cases" element={<div>Case outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'KYC Case Explorer', level: 2 }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('KYC Case Explorer | Cognizant KYC Fabric');
    });

    expect(usePlatformStore.getState().currentRoute).toBe('cases');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'KYC Case Explorer',
    );
    expect(screen.getByText('Case outlet')).toBeInTheDocument();
    expect(screen.getByText('Decision brief')).toBeInTheDocument();
    const accountOpeningLinks = screen.getAllByRole('link', {
      name: /corporate account opening/i,
    });
    accountOpeningLinks.forEach((link) => expect(link).toHaveAttribute('href', '/'));

    const accountOpeningClick = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    accountOpeningLinks[0].dispatchEvent(accountOpeningClick);
    expect(accountOpeningClick.defaultPrevented).toBe(false);

    expect(screen.getByText(/talk to the onboarding support team/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /onboarding@harborcommercial.com/i })).toHaveAttribute(
      'href',
      'mailto:onboarding@harborcommercial.com',
    );
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /command palette/i }));

    expect(usePlatformStore.getState().setCommandPaletteOpen).toHaveBeenCalledWith(true);
  });
});
