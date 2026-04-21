import { describe, expect, it } from 'vitest';
import { checkKycPayload } from './check-kyc-payload';

describe('checkKycPayload', () => {
  it('ships a realistic default commercial onboarding payload', () => {
    expect(checkKycPayload.brandName).toBe('Harbor Commercial');
    expect(checkKycPayload.companyInfo.legalName).toBe('Atlas Meridian Holdings, Inc.');
    expect(checkKycPayload.bankingProfile.requestedProducts).toContain('Operating account');
    expect(checkKycPayload.beneficialOwners[0]).toMatchObject({
      fullName: 'Morgan Chen',
      isAuthorizedSigner: true,
    });
    expect(checkKycPayload.documents.signerIdentification).toBe(false);
    expect(checkKycPayload.additionalNotes).toBe('');
  });
});
