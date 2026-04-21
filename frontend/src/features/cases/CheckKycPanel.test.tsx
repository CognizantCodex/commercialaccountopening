import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CheckKycPanel } from '@/features/cases/CheckKycPanel';
import { checkKycPayload } from '@/features/cases/check-kyc-payload';
import { platformApi } from '@/services/platform-api';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('CheckKycPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the readonly intake payload and submits a successful check', async () => {
    const user = userEvent.setup();
    const checkKycSpy = vi.spyOn(platformApi, 'checkKyc').mockResolvedValue({
      status: 'pass',
      message: 'KYC screening passed for Atlas Meridian Holdings, Inc.',
      checkedAt: '2026-04-21T06:30:00Z',
    });

    renderWithProviders(<CheckKycPanel />);

    expect(screen.getByDisplayValue('Atlas Meridian Holdings, Inc.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Authorized signer' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: /run checkkyc/i }));

    expect(checkKycSpy).toHaveBeenCalledWith(checkKycPayload);
    expect(await screen.findByText('PASS')).toBeInTheDocument();
    expect(screen.getByText(/KYC screening passed for Atlas Meridian Holdings, Inc\./i)).toBeInTheDocument();
  });

  it('surfaces a fallback error message when the API rejects with a non-Error value', async () => {
    const user = userEvent.setup();
    vi.spyOn(platformApi, 'checkKyc').mockRejectedValue('service unavailable');

    renderWithProviders(<CheckKycPanel />);

    await user.click(screen.getByRole('button', { name: /run checkkyc/i }));

    expect(await screen.findByText('Unable to run KYC check right now.')).toBeInTheDocument();
  });
});
