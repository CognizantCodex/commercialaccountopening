import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { platformApi } from '@/services/platform-api';
import { usePlatformStore } from '@/store';
import { getSelectedCase } from '@/services/selectors';
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

function titleCaseWords(value: string) {
  return value
    .split(/[\s/-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildDerivedPayload(selectedCase: NonNullable<ReturnType<typeof getSelectedCase>>, selectedClient?: { name: string; headquarters: string; sector: string; annualRevenueUsd: number }) {
  const advisorNode =
    selectedCase.ownershipGraph.nodes.find((node) => node.group === 'advisor') ?? null;
  const ownerNodes = selectedCase.ownershipGraph.nodes.filter(
    (node) => node.group === 'beneficial-owner',
  );
  const jurisdictionParts = selectedCase.jurisdiction.split('/').map((value) => value.trim());
  const [incorporationCountry = selectedCase.jurisdiction, operatingCountry = incorporationCountry] =
    jurisdictionParts;
  const [city = selectedClient?.headquarters ?? '', state = ''] =
    (selectedClient?.headquarters ?? '').split(',').map((part) => part.trim());

  const documentKeys = selectedCase.documents.map((document) => document.type.toLowerCase());
  const qcText = selectedCase.qcRules.map((rule) => `${rule.label}: ${rule.rationale}`).join(' ');

  return {
    brandName: 'Harbor Commercial',
    formTitle: 'Corporate Account Opening Application',
    companyInfo: {
      legalName: selectedClient?.name ?? selectedCase.caseName,
      tradingName: selectedClient?.name ?? selectedCase.caseName,
      entityType: 'Corporation',
      registrationNumber: selectedCase.id.toUpperCase(),
      taxId: '',
      incorporationDate: '',
      incorporationState: state,
      incorporationCountry,
      industry: selectedClient?.sector ?? 'Corporate Services',
      website: '',
      annualRevenue: selectedClient?.annualRevenueUsd
        ? String(selectedClient.annualRevenueUsd)
        : '',
      employeeCount: '',
    },
    primaryContact: {
      fullName: advisorNode?.name ?? selectedCase.assignedTo,
      title: advisorNode?.role ?? 'Case advisor',
      email: '',
      phone: '',
      extension: '',
    },
    addresses: {
      registeredLine1: '',
      registeredLine2: '',
      city,
      state,
      postalCode: '',
      country: incorporationCountry,
      operatingSameAsRegistered: incorporationCountry === operatingCountry,
      operatingLine1: '',
      operatingLine2: '',
      operatingCity: city,
      operatingState: state,
      operatingPostalCode: '',
      operatingCountry,
    },
    bankingProfile: {
      accountPurpose: selectedCase.narrative,
      requestedProducts: ['Corporate account'],
      expectedOpeningDeposit: '',
      monthlyIncoming: '',
      monthlyOutgoing: '',
      onlineBankingUsers: '',
      internationalActivity: jurisdictionParts.length > 1,
      jurisdictionsInScope: selectedCase.jurisdiction,
      needsCommercialCards: /card/i.test(qcText),
    },
    beneficialOwners: (ownerNodes.length ? ownerNodes : []).map((owner, index) => ({
      id: owner.id,
      fullName: owner.name,
      title: owner.role,
      ownershipPercentage: '',
      email: '',
      phone: '',
      isAuthorizedSigner: index === 0,
    })),
    documents: {
      certificateOfFormation: documentKeys.some((value) =>
        /(formation|incorporation|good standing)/.test(value),
      ),
      taxIdLetter: documentKeys.some((value) => /(tax|ein)/.test(value)),
      ownershipChart: documentKeys.some((value) => /(ownership|ubo)/.test(value)),
      boardResolution: documentKeys.some((value) => /(board|resolution)/.test(value)),
      signerIdentification: documentKeys.some((value) => /(signer|passport|identification)/.test(value)),
      addressProof: documentKeys.some((value) => /(address|proof)/.test(value)),
    },
    declarations: {
      certifyAuthority: true,
      certifyBeneficialOwners: ownerNodes.length > 0,
      confirmTaxCompliance: selectedCase.riskScore < 80,
      confirmTerms: true,
    },
    additionalNotes: `${titleCaseWords(selectedCase.status)} case in ${selectedCase.stage}. ${selectedCase.nextBestAction}`,
  } satisfies CheckKycRequest;
}

export function CheckKycPanel() {
  const [result, setResult] = useState<CheckKycResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const selectedCase = usePlatformStore(getSelectedCase);
  const selectedClient = usePlatformStore((state) =>
    state.clients.find((client) => client.id === selectedCase?.clientId),
  );
  const payload: CheckKycRequest = useMemo(() => {
    if (!selectedCase) {
      return checkKycPayload;
    }

    return selectedCase.intakeForm ?? buildDerivedPayload(selectedCase, selectedClient);
  }, [selectedCase, selectedClient]);

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
