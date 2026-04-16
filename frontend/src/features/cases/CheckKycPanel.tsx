import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { platformApi } from '@/services/platform-api';
import type { CheckKycRequest, CheckKycResponse } from '@/types/platform';
import { checkKycPayload } from './check-kyc-payload';

function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="w-full rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none"
      />
    </label>
  );
}

function ReadonlyFlag({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[1rem] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--foreground)]">
      <input
        type="checkbox"
        checked={checked}
        readOnly
        aria-readonly="true"
        className="h-4 w-4 accent-[var(--accent)]"
      />
      <span>{label}</span>
    </label>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">{title}</h4>;
}

export function CheckKycPanel() {
  const [result, setResult] = useState<CheckKycResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const payload: CheckKycRequest = checkKycPayload;

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await platformApi.checkKyc(payload);
      setResult(response);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to run KYC check right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="info">Read-only intake form</Badge>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {payload.brandName}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {payload.formTitle}
          </p>
        </div>
        {result ? (
          <Badge variant={result.status === 'pass' ? 'success' : 'danger'}>
            {result.status.toUpperCase()}
          </Badge>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6">
        <section className="grid gap-4">
          <SectionTitle title="Company information" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadonlyField label="Legal name" value={payload.companyInfo.legalName} />
            <ReadonlyField label="Trading name" value={payload.companyInfo.tradingName} />
            <ReadonlyField label="Entity type" value={payload.companyInfo.entityType} />
            <ReadonlyField label="Registration number" value={payload.companyInfo.registrationNumber} />
            <ReadonlyField label="Tax ID" value={payload.companyInfo.taxId} />
            <ReadonlyField label="Incorporation date" value={payload.companyInfo.incorporationDate} />
            <ReadonlyField label="State" value={payload.companyInfo.incorporationState} />
            <ReadonlyField label="Country" value={payload.companyInfo.incorporationCountry} />
            <ReadonlyField label="Industry" value={payload.companyInfo.industry} />
            <ReadonlyField label="Website" value={payload.companyInfo.website} />
            <ReadonlyField label="Annual revenue" value={payload.companyInfo.annualRevenue} />
            <ReadonlyField label="Employee count" value={payload.companyInfo.employeeCount} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4">
            <SectionTitle title="Primary contact" />
            <ReadonlyField label="Full name" value={payload.primaryContact.fullName} />
            <ReadonlyField label="Title" value={payload.primaryContact.title} />
            <ReadonlyField label="Email" value={payload.primaryContact.email} />
            <ReadonlyField label="Phone" value={payload.primaryContact.phone} />
            <ReadonlyField label="Extension" value={payload.primaryContact.extension} />
          </div>

          <div className="grid gap-4">
            <SectionTitle title="Addresses" />
            <ReadonlyField label="Registered address line 1" value={payload.addresses.registeredLine1} />
            <ReadonlyField label="Registered address line 2" value={payload.addresses.registeredLine2} />
            <ReadonlyField
              label="Registered city, state, postal code"
              value={`${payload.addresses.city}, ${payload.addresses.state} ${payload.addresses.postalCode}`}
            />
            <ReadonlyField label="Country" value={payload.addresses.country} />
            <ReadonlyFlag
              label="Operating address matches registered address"
              checked={payload.addresses.operatingSameAsRegistered}
            />
            <ReadonlyField label="Operating country" value={payload.addresses.operatingCountry} />
          </div>
        </section>

        <section className="grid gap-4">
          <SectionTitle title="Banking profile" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ReadonlyField label="Account purpose" value={payload.bankingProfile.accountPurpose} />
            <ReadonlyField
              label="Requested products"
              value={payload.bankingProfile.requestedProducts.join(', ')}
            />
            <ReadonlyField
              label="Expected opening deposit"
              value={payload.bankingProfile.expectedOpeningDeposit}
            />
            <ReadonlyField label="Monthly incoming" value={payload.bankingProfile.monthlyIncoming} />
            <ReadonlyField label="Monthly outgoing" value={payload.bankingProfile.monthlyOutgoing} />
            <ReadonlyField
              label="Online banking users"
              value={payload.bankingProfile.onlineBankingUsers}
            />
            <ReadonlyFlag
              label="International activity"
              checked={payload.bankingProfile.internationalActivity}
            />
            <ReadonlyField
              label="Jurisdictions in scope"
              value={payload.bankingProfile.jurisdictionsInScope || 'None'}
            />
            <ReadonlyFlag
              label="Commercial cards requested"
              checked={payload.bankingProfile.needsCommercialCards}
            />
          </div>
        </section>

        <section className="grid gap-4">
          <SectionTitle title="Beneficial owners" />
          {payload.beneficialOwners.map((owner) => (
            <div
              key={owner.id}
              className="grid gap-4 rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <ReadonlyField label="Full name" value={owner.fullName} />
              <ReadonlyField label="Title" value={owner.title} />
              <ReadonlyField label="Ownership %" value={owner.ownershipPercentage} />
              <ReadonlyField label="Email" value={owner.email} />
              <ReadonlyField label="Phone" value={owner.phone} />
              <ReadonlyFlag label="Authorized signer" checked={owner.isAuthorizedSigner} />
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-3">
            <SectionTitle title="Documents" />
            <ReadonlyFlag
              label="Certificate of formation"
              checked={payload.documents.certificateOfFormation}
            />
            <ReadonlyFlag label="Tax ID letter" checked={payload.documents.taxIdLetter} />
            <ReadonlyFlag label="Ownership chart" checked={payload.documents.ownershipChart} />
            <ReadonlyFlag label="Board resolution" checked={payload.documents.boardResolution} />
            <ReadonlyFlag
              label="Signer identification"
              checked={payload.documents.signerIdentification}
            />
            <ReadonlyFlag label="Address proof" checked={payload.documents.addressProof} />
          </div>

          <div className="grid gap-3">
            <SectionTitle title="Declarations" />
            <ReadonlyFlag
              label="Authority certified"
              checked={payload.declarations.certifyAuthority}
            />
            <ReadonlyFlag
              label="Beneficial owners certified"
              checked={payload.declarations.certifyBeneficialOwners}
            />
            <ReadonlyFlag
              label="Tax compliance confirmed"
              checked={payload.declarations.confirmTaxCompliance}
            />
            <ReadonlyFlag
              label="Terms confirmed"
              checked={payload.declarations.confirmTerms}
            />
            <ReadonlyField
              label="Additional notes"
              value={payload.additionalNotes || 'None'}
            />
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? 'Checking…' : 'Run checkKYC'}
        </Button>
        {result ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            {result.message} Checked at {new Date(result.checkedAt).toLocaleString()}.
          </p>
        ) : null}
        {submitError ? <p className="text-sm text-[var(--danger)]">{submitError}</p> : null}
      </div>
    </Card>
  );
}
