import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { CheckKycPanel } from '@/features/cases/CheckKycPanel';
import { checkKycPayload } from '@/features/cases/check-kyc-payload';
import { platformApi } from '@/services/platform-api';
import { usePlatformStore } from '@/store';
import { renderWithProviders, screen } from '@/test/test-utils';

describe('CheckKycPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    usePlatformStore.setState({
      cases: [
        {
          ...usePlatformStore.getState().cases[0],
          id: 'case-checkkyc-static',
          clientId: usePlatformStore.getState().cases[0]?.clientId ?? 'client-aurora',
          intakeForm: checkKycPayload,
        },
      ],
      selectedCaseId: 'case-checkkyc-static',
    });
  });

  it('renders the readonly intake payload and submits a successful check', async () => {
    const user = userEvent.setup();
    const checkKycSpy = vi.spyOn(platformApi, 'checkKyc').mockResolvedValue({
      status: 'pass',
      message: 'KYC screening passed for Atlas Meridian Holdings, Inc.',
      checkedAt: '2026-04-21T06:30:00Z',
    });

    renderWithProviders(<CheckKycPanel />);

    expect(screen.getAllByDisplayValue('Atlas Meridian Holdings, Inc.').length).toBeGreaterThan(0);
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

  it('updates the readonly intake form when a different case is selected', () => {
    usePlatformStore.setState({
      clients: [
        {
          id: 'client-selected',
          name: 'Selected Client LLC',
          segment: 'Corporate',
          headquarters: 'Boston, Massachusetts',
          region: 'North America',
          coordinates: [-71.0589, 42.3601],
          sector: 'Investment management',
          annualRevenueUsd: 4200000,
        },
      ],
      cases: [
        {
          ...usePlatformStore.getState().cases[0],
          id: 'case-selected',
          clientId: 'client-selected',
          intakeForm: undefined,
          caseName: 'Selected Client Submission',
          assignedTo: 'Jordan Lee',
          status: 'exception',
          stage: 'advisor-review',
          jurisdiction: 'United States / Canada',
          narrative: 'Selected case narrative',
          nextBestAction: 'Review the selected case details.',
          ownershipGraph: {
            nodes: [
              { id: 'client', name: 'Selected Client LLC', role: 'Client', group: 'client' },
              {
                id: 'owner-1',
                name: 'Jamie Owner',
                role: 'Beneficial owner',
                group: 'beneficial-owner',
              },
              { id: 'advisor-1', name: 'Jordan Lee', role: 'Advisor', group: 'advisor' },
            ],
            links: [],
          },
          documents: [
            {
              id: 'doc-address',
              type: 'Proof of Address',
              status: 'validated',
              completeness: 100,
              uploadedAt: '2026-04-21T10:00:00Z',
              extractedFields: ['address'],
            },
          ],
          qcRules: [],
        },
      ],
      selectedCaseId: 'case-selected',
    });

    renderWithProviders(<CheckKycPanel />);

    expect(screen.getAllByDisplayValue('Selected Client LLC').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByDisplayValue('United States / Canada')).toBeInTheDocument();
  });
});
