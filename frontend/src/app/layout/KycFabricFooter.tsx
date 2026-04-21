const SUPPORT_EMAIL = 'onboarding@harborcommercial.com';

export function KycFabricFooter() {
  return (
    <footer className="mx-auto mt-6 flex w-full max-w-[1700px] flex-col justify-between gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(8,19,41,0.84),rgba(9,21,45,0.72))] px-5 py-5 shadow-[var(--shadow-card)] backdrop-blur-xl lg:flex-row lg:items-center lg:px-6">
      <div className="max-w-[56ch]">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          Need help?
        </p>
        <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
          Talk to the onboarding support team
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Reach out for document issues, signer guidance, or review escalations across the KYC
          Fabric workspace.
        </p>
      </div>
      <a
        className="grid min-w-[240px] gap-1 rounded-[1.2rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(63,199,255,0.14),rgba(123,230,212,0.08))] px-5 py-4 text-left no-underline shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgba(149,242,227,0.3)]"
        href={`mailto:${SUPPORT_EMAIL}`}
      >
        <span className="font-semibold text-[var(--foreground)]">{SUPPORT_EMAIL}</span>
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
          Email support
        </span>
      </a>
    </footer>
  );
}
