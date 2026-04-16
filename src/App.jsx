import { startTransition, useEffect, useRef, useState } from "react";
import { loadWorkspace, saveWorkspace } from "./api";
import { defaultWorkspace } from "./defaultWorkspace";

function createOwner(id = `owner-${Date.now()}`) {
  return {
    id,
    fullName: "",
    title: "",
    ownershipPercentage: "",
    email: "",
    phone: "",
    isAuthorizedSigner: false,
  };
}

function mergeWorkspace(candidate = {}) {
  return {
    ...defaultWorkspace,
    ...candidate,
    companyInfo: {
      ...defaultWorkspace.companyInfo,
      ...(candidate.companyInfo ?? {}),
    },
    primaryContact: {
      ...defaultWorkspace.primaryContact,
      ...(candidate.primaryContact ?? {}),
    },
    addresses: {
      ...defaultWorkspace.addresses,
      ...(candidate.addresses ?? {}),
    },
    bankingProfile: {
      ...defaultWorkspace.bankingProfile,
      ...(candidate.bankingProfile ?? {}),
      requestedProducts:
        candidate.bankingProfile?.requestedProducts?.length
          ? candidate.bankingProfile.requestedProducts
          : defaultWorkspace.bankingProfile.requestedProducts,
    },
    documents: {
      ...defaultWorkspace.documents,
      ...(candidate.documents ?? {}),
    },
    declarations: {
      ...defaultWorkspace.declarations,
      ...(candidate.declarations ?? {}),
    },
    steps: candidate.steps?.length ? candidate.steps : defaultWorkspace.steps,
    entityTypeOptions:
      candidate.entityTypeOptions?.length
        ? candidate.entityTypeOptions
        : defaultWorkspace.entityTypeOptions,
    industryOptions:
      candidate.industryOptions?.length
        ? candidate.industryOptions
        : defaultWorkspace.industryOptions,
    countryOptions:
      candidate.countryOptions?.length
        ? candidate.countryOptions
        : defaultWorkspace.countryOptions,
    productOptions:
      candidate.productOptions?.length
        ? candidate.productOptions
        : defaultWorkspace.productOptions,
    documentOptions:
      candidate.documentOptions?.length
        ? candidate.documentOptions
        : defaultWorkspace.documentOptions,
    declarationOptions:
      candidate.declarationOptions?.length
        ? candidate.declarationOptions
        : defaultWorkspace.declarationOptions,
    beneficialOwners:
      candidate.beneficialOwners?.length
        ? candidate.beneficialOwners.map((owner, index) => ({
            ...createOwner(owner.id ?? `owner-${index + 1}`),
            ...owner,
          }))
        : defaultWorkspace.beneficialOwners,
  };
}

function isFilled(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return String(value ?? "").trim().length > 0;
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return "Not synced yet";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Recently synced";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StepButton({ step, active, meta, onClick }) {
  return (
    <button
      type="button"
      className={`step-button${active ? " active" : ""}`}
      onClick={() => onClick(step.id)}
    >
      <span className="step-number">{step.eyebrow}</span>
      <span className="step-content">
        <strong>{step.label}</strong>
        <small>{step.title}</small>
      </span>
      <span className="step-meta">{meta}</span>
    </button>
  );
}

function SummaryChip({ label, value, tone = "default" }) {
  return (
    <div className={`summary-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, required = false }) {
  return (
    <label className="field field-textarea">
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <textarea value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

function OptionCard({ title, detail, checked, onChange }) {
  return (
    <label className={`option-card${checked ? " checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="option-mark" aria-hidden="true" />
      <span className="option-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
    </label>
  );
}

function OwnerCard({ owner, index, onFieldChange, onToggleSigner, onRemove, canRemove }) {
  return (
    <article className="owner-card">
      <div className="owner-card-header">
        <div>
          <p className="section-eyebrow">Owner {index + 1}</p>
          <h4>Beneficial owner or control person</h4>
        </div>
        {canRemove ? (
          <button type="button" className="ghost-button" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>

      <div className="form-grid">
        <TextField
          label="Full name"
          value={owner.fullName}
          onChange={(event) => onFieldChange("fullName", event.target.value)}
          placeholder="Full legal name"
          required
        />
        <TextField
          label="Title"
          value={owner.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          placeholder="Role or title"
          required
        />
        <TextField
          label="Ownership %"
          value={owner.ownershipPercentage}
          onChange={(event) =>
            onFieldChange("ownershipPercentage", event.target.value)
          }
          placeholder="25"
          required
        />
        <TextField
          label="Email"
          type="email"
          value={owner.email}
          onChange={(event) => onFieldChange("email", event.target.value)}
          placeholder="name@company.com"
        />
        <TextField
          label="Phone"
          value={owner.phone}
          onChange={(event) => onFieldChange("phone", event.target.value)}
          placeholder="+1 (000) 000-0000"
        />
      </div>

      <label className="inline-toggle">
        <input
          type="checkbox"
          checked={owner.isAuthorizedSigner}
          onChange={onToggleSigner}
        />
        <span>This individual is also an authorized signer on the account.</span>
      </label>
    </article>
  );
}

function App() {
  const [workspace, setWorkspace] = useState(defaultWorkspace);
  const [connectionState, setConnectionState] = useState("loading");
  const [saveState, setSaveState] = useState("idle");
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Connecting to the secure application workspace...",
  );
  const saveVersionRef = useRef(0);

  useEffect(() => {
    let ignore = false;

    async function bootstrapWorkspace() {
      try {
        const remoteWorkspace = await loadWorkspace();
        if (ignore) {
          return;
        }

        setWorkspace(mergeWorkspace(remoteWorkspace));
        setConnectionState("connected");
        setStatusMessage("Secure draft loaded from the application workspace.");
        setHasBootstrapped(true);
      } catch {
        if (ignore) {
          return;
        }

        setWorkspace(mergeWorkspace(defaultWorkspace));
        setConnectionState("fallback");
        setStatusMessage(
          "The form is using local draft data until the application workspace is reachable.",
        );
        setHasBootstrapped(true);
      }
    }

    bootstrapWorkspace();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!hasBootstrapped || !hasUnsavedChanges || saveState !== "idle") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void persistWorkspace("auto");
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [workspace, hasBootstrapped, hasUnsavedChanges, saveState]);

  const currentStep =
    workspace.steps.find((step) => step.id === workspace.activeStep) ??
    workspace.steps[0];
  const currentStepIndex = workspace.steps.findIndex(
    (step) => step.id === workspace.activeStep,
  );
  const nextStep =
    workspace.steps[Math.min(currentStepIndex + 1, workspace.steps.length - 1)] ??
    workspace.steps[workspace.steps.length - 1];
  const previousStep =
    workspace.steps[Math.max(currentStepIndex - 1, 0)] ?? workspace.steps[0];

  const sectionCompletion = {
    company: {
      complete: [
        workspace.companyInfo.legalName,
        workspace.companyInfo.registrationNumber,
        workspace.companyInfo.taxId,
        workspace.companyInfo.incorporationDate,
        workspace.companyInfo.incorporationState,
        workspace.companyInfo.industry,
      ].filter(isFilled).length,
      total: 6,
    },
    contact: {
      complete: [
        workspace.primaryContact.fullName,
        workspace.primaryContact.email,
        workspace.primaryContact.phone,
        workspace.addresses.registeredLine1,
        workspace.addresses.city,
        workspace.addresses.state,
        workspace.addresses.postalCode,
      ].filter(isFilled).length,
      total: 7,
    },
    banking: {
      complete: [
        workspace.bankingProfile.accountPurpose,
        workspace.bankingProfile.requestedProducts.length > 0,
        workspace.bankingProfile.expectedOpeningDeposit,
        workspace.bankingProfile.monthlyIncoming,
        workspace.bankingProfile.monthlyOutgoing,
      ].filter(isFilled).length,
      total: 5,
    },
    ownership: {
      complete: [
        workspace.beneficialOwners.some(
          (owner) => isFilled(owner.fullName) && isFilled(owner.ownershipPercentage),
        ),
        workspace.beneficialOwners.some((owner) => owner.isAuthorizedSigner),
      ].filter(Boolean).length,
      total: 2,
    },
    documents: {
      complete: [
        Object.values(workspace.documents).filter(Boolean).length >= 3,
        workspace.declarations.certifyAuthority,
        workspace.declarations.certifyBeneficialOwners,
        workspace.declarations.confirmTaxCompliance,
        workspace.declarations.confirmTerms,
      ].filter(Boolean).length,
      total: 5,
    },
  };

  const completedSections = Object.values(sectionCompletion).filter(
    (section) => section.complete === section.total,
  ).length;
  const totalChecks = Object.values(sectionCompletion).reduce(
    (sum, section) => sum + section.total,
    0,
  );
  const completedChecks = Object.values(sectionCompletion).reduce(
    (sum, section) => sum + section.complete,
    0,
  );
  const completionPercentage = Math.round((completedChecks / totalChecks) * 100);

  const missingItems = [];
  if (!isFilled(workspace.companyInfo.legalName)) {
    missingItems.push("Enter the full legal entity name.");
  }
  if (!isFilled(workspace.companyInfo.taxId)) {
    missingItems.push("Provide the federal tax ID / EIN.");
  }
  if (!isFilled(workspace.primaryContact.email)) {
    missingItems.push("Add the primary contact email address.");
  }
  if (!isFilled(workspace.addresses.registeredLine1)) {
    missingItems.push("Complete the registered business address.");
  }
  if (!isFilled(workspace.bankingProfile.accountPurpose)) {
    missingItems.push("Describe the intended use of the account.");
  }
  if (
    !workspace.beneficialOwners.some(
      (owner) => isFilled(owner.fullName) && isFilled(owner.ownershipPercentage),
    )
  ) {
    missingItems.push("Add at least one beneficial owner or control person.");
  }
  if (!workspace.declarations.confirmTerms) {
    missingItems.push("Review and accept the final declarations.");
  }

  const lastSyncedLabel = formatTimestamp(workspace.lastUpdatedAt);
  const backendLabel =
    connectionState === "connected"
      ? "Workspace connected"
      : connectionState === "fallback"
        ? "Draft mode"
        : "Connecting";
  const saveLabel =
    saveState === "saving"
      ? "Saving draft..."
      : saveState === "saved"
        ? "All changes saved"
        : "Save draft";

  function markDirty() {
    saveVersionRef.current += 1;
    setHasUnsavedChanges(true);
    setSaveState("idle");
  }

  async function persistWorkspace(mode = "manual") {
    const versionAtRequest = saveVersionRef.current;
    const snapshot = workspace;

    setSaveState("saving");
    setStatusMessage(
      mode === "manual"
        ? "Saving your corporate account opening draft to the secure database..."
        : "Saving application changes to the secure database...",
    );

    try {
      const savedWorkspace = await saveWorkspace(snapshot);
      const mergedWorkspace = mergeWorkspace(savedWorkspace);

      setConnectionState("connected");
      setSaveState("saved");

      if (saveVersionRef.current === versionAtRequest) {
        setWorkspace(mergedWorkspace);
        setHasUnsavedChanges(false);
      } else {
        setWorkspace((current) => ({
          ...current,
          lastUpdatedAt: mergedWorkspace.lastUpdatedAt,
        }));
      }

      setStatusMessage(
        mode === "manual"
          ? "Draft saved to the secure database."
          : "All changes have been saved to the secure database.",
      );
    } catch {
      setConnectionState("fallback");
      setSaveState("error");
      setStatusMessage(
        "We couldn't save right now. Your changes remain in the browser until the database is reachable again.",
      );
    }
  }

  function updateSection(section, field, value) {
    setWorkspace((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    markDirty();
  }

  function updateTopLevel(field, value) {
    setWorkspace((current) => ({
      ...current,
      [field]: value,
    }));
    markDirty();
  }

  function updateOwner(ownerId, field, value) {
    setWorkspace((current) => ({
      ...current,
      beneficialOwners: current.beneficialOwners.map((owner) =>
        owner.id === ownerId ? { ...owner, [field]: value } : owner,
      ),
    }));
    markDirty();
  }

  function removeOwner(ownerId) {
    setWorkspace((current) => ({
      ...current,
      beneficialOwners: current.beneficialOwners.filter((owner) => owner.id !== ownerId),
    }));
    markDirty();
  }

  function addOwner() {
    startTransition(() => {
      setWorkspace((current) => ({
        ...current,
        beneficialOwners: [...current.beneficialOwners, createOwner()],
      }));
    });
    markDirty();
  }

  function handleStepChange(stepId) {
    startTransition(() => {
      setWorkspace((current) => ({
        ...current,
        activeStep: stepId,
      }));
    });
    markDirty();
  }

  function toggleProduct(product) {
    setWorkspace((current) => ({
      ...current,
      bankingProfile: {
        ...current.bankingProfile,
        requestedProducts: current.bankingProfile.requestedProducts.includes(product)
          ? current.bankingProfile.requestedProducts.filter(
              (existing) => existing !== product,
            )
          : [...current.bankingProfile.requestedProducts, product],
      },
    }));
    markDirty();
  }

  function toggleDocument(key) {
    setWorkspace((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [key]: !current.documents[key],
      },
    }));
    markDirty();
  }

  function toggleDeclaration(key) {
    setWorkspace((current) => ({
      ...current,
      declarations: {
        ...current.declarations,
        [key]: !current.declarations[key],
      },
    }));
    markDirty();
  }

  async function handleSave() {
    await persistWorkspace("manual");
  }

  function renderCompanySection() {
    return (
      <>
        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Corporate profile</p>
              <h3>Tell us about the legal entity</h3>
              <p>
                Enter the business details exactly as they appear on formation and
                tax registration documents.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <TextField
              label="Legal entity name"
              value={workspace.companyInfo.legalName}
              onChange={(event) =>
                updateSection("companyInfo", "legalName", event.target.value)
              }
              placeholder="Acme Holdings Corporation"
              required
            />
            <TextField
              label="Trading / DBA name"
              value={workspace.companyInfo.tradingName}
              onChange={(event) =>
                updateSection("companyInfo", "tradingName", event.target.value)
              }
              placeholder="Acme Holdings"
            />
            <SelectField
              label="Entity type"
              value={workspace.companyInfo.entityType}
              onChange={(event) =>
                updateSection("companyInfo", "entityType", event.target.value)
              }
              options={workspace.entityTypeOptions}
              required
            />
            <TextField
              label="Registration number"
              value={workspace.companyInfo.registrationNumber}
              onChange={(event) =>
                updateSection("companyInfo", "registrationNumber", event.target.value)
              }
              placeholder="State file / registration number"
              required
            />
            <TextField
              label="Federal tax ID / EIN"
              value={workspace.companyInfo.taxId}
              onChange={(event) =>
                updateSection("companyInfo", "taxId", event.target.value)
              }
              placeholder="12-3456789"
              required
            />
            <TextField
              label="Date of incorporation"
              type="date"
              value={workspace.companyInfo.incorporationDate}
              onChange={(event) =>
                updateSection("companyInfo", "incorporationDate", event.target.value)
              }
              required
            />
            <TextField
              label="State / province of registration"
              value={workspace.companyInfo.incorporationState}
              onChange={(event) =>
                updateSection("companyInfo", "incorporationState", event.target.value)
              }
              placeholder="Delaware"
              required
            />
            <SelectField
              label="Country of registration"
              value={workspace.companyInfo.incorporationCountry}
              onChange={(event) =>
                updateSection(
                  "companyInfo",
                  "incorporationCountry",
                  event.target.value,
                )
              }
              options={workspace.countryOptions}
            />
            <SelectField
              label="Primary industry"
              value={workspace.companyInfo.industry || workspace.industryOptions[0]}
              onChange={(event) =>
                updateSection("companyInfo", "industry", event.target.value)
              }
              options={workspace.industryOptions}
              required
            />
            <TextField
              label="Website"
              value={workspace.companyInfo.website}
              onChange={(event) =>
                updateSection("companyInfo", "website", event.target.value)
              }
              placeholder="https://www.company.com"
            />
            <TextField
              label="Annual revenue (USD)"
              value={workspace.companyInfo.annualRevenue}
              onChange={(event) =>
                updateSection("companyInfo", "annualRevenue", event.target.value)
              }
              placeholder="25,000,000"
            />
            <TextField
              label="Employee count"
              value={workspace.companyInfo.employeeCount}
              onChange={(event) =>
                updateSection("companyInfo", "employeeCount", event.target.value)
              }
              placeholder="120"
            />
          </div>
        </section>
      </>
    );
  }

  function renderContactSection() {
    return (
      <>
        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Primary contact</p>
              <h3>Who should we contact about the application?</h3>
              <p>
                This person receives follow-up questions, document requests, and
                onboarding instructions.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <TextField
              label="Full name"
              value={workspace.primaryContact.fullName}
              onChange={(event) =>
                updateSection("primaryContact", "fullName", event.target.value)
              }
              placeholder="Jordan Lee"
              required
            />
            <TextField
              label="Title"
              value={workspace.primaryContact.title}
              onChange={(event) =>
                updateSection("primaryContact", "title", event.target.value)
              }
              placeholder="Chief Financial Officer"
            />
            <TextField
              label="Email"
              type="email"
              value={workspace.primaryContact.email}
              onChange={(event) =>
                updateSection("primaryContact", "email", event.target.value)
              }
              placeholder="jordan.lee@company.com"
              required
            />
            <TextField
              label="Phone"
              value={workspace.primaryContact.phone}
              onChange={(event) =>
                updateSection("primaryContact", "phone", event.target.value)
              }
              placeholder="+1 (000) 000-0000"
              required
            />
            <TextField
              label="Extension"
              value={workspace.primaryContact.extension}
              onChange={(event) =>
                updateSection("primaryContact", "extension", event.target.value)
              }
              placeholder="204"
            />
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Registered address</p>
              <h3>Where is the business legally registered?</h3>
            </div>
          </div>

          <div className="form-grid">
            <TextField
              label="Address line 1"
              value={workspace.addresses.registeredLine1}
              onChange={(event) =>
                updateSection("addresses", "registeredLine1", event.target.value)
              }
              placeholder="100 Market Street"
              required
            />
            <TextField
              label="Address line 2"
              value={workspace.addresses.registeredLine2}
              onChange={(event) =>
                updateSection("addresses", "registeredLine2", event.target.value)
              }
              placeholder="Suite 1200"
            />
            <TextField
              label="City"
              value={workspace.addresses.city}
              onChange={(event) =>
                updateSection("addresses", "city", event.target.value)
              }
              placeholder="San Francisco"
              required
            />
            <TextField
              label="State / province"
              value={workspace.addresses.state}
              onChange={(event) =>
                updateSection("addresses", "state", event.target.value)
              }
              placeholder="California"
              required
            />
            <TextField
              label="Postal code"
              value={workspace.addresses.postalCode}
              onChange={(event) =>
                updateSection("addresses", "postalCode", event.target.value)
              }
              placeholder="94105"
              required
            />
            <SelectField
              label="Country"
              value={workspace.addresses.country}
              onChange={(event) =>
                updateSection("addresses", "country", event.target.value)
              }
              options={workspace.countryOptions}
            />
          </div>

          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={workspace.addresses.operatingSameAsRegistered}
              onChange={(event) =>
                updateSection(
                  "addresses",
                  "operatingSameAsRegistered",
                  event.target.checked,
                )
              }
            />
            <span>The principal operating address is the same as the registered address.</span>
          </label>

          {!workspace.addresses.operatingSameAsRegistered ? (
            <div className="form-grid nested-grid">
              <TextField
                label="Operating address line 1"
                value={workspace.addresses.operatingLine1}
                onChange={(event) =>
                  updateSection("addresses", "operatingLine1", event.target.value)
                }
                placeholder="250 Industrial Drive"
              />
              <TextField
                label="Operating address line 2"
                value={workspace.addresses.operatingLine2}
                onChange={(event) =>
                  updateSection("addresses", "operatingLine2", event.target.value)
                }
                placeholder="Floor 3"
              />
              <TextField
                label="Operating city"
                value={workspace.addresses.operatingCity}
                onChange={(event) =>
                  updateSection("addresses", "operatingCity", event.target.value)
                }
                placeholder="Oakland"
              />
              <TextField
                label="Operating state / province"
                value={workspace.addresses.operatingState}
                onChange={(event) =>
                  updateSection("addresses", "operatingState", event.target.value)
                }
                placeholder="California"
              />
              <TextField
                label="Operating postal code"
                value={workspace.addresses.operatingPostalCode}
                onChange={(event) =>
                  updateSection("addresses", "operatingPostalCode", event.target.value)
                }
                placeholder="94607"
              />
              <SelectField
                label="Operating country"
                value={workspace.addresses.operatingCountry}
                onChange={(event) =>
                  updateSection("addresses", "operatingCountry", event.target.value)
                }
                options={workspace.countryOptions}
              />
            </div>
          ) : null}
        </section>
      </>
    );
  }

  function renderBankingSection() {
    return (
      <>
        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Account requirements</p>
              <h3>Tell us how the business intends to use the account</h3>
              <p>
                This helps us match the right products, controls, and digital access.
              </p>
            </div>
          </div>

          <TextAreaField
            label="Primary purpose of the account"
            value={workspace.bankingProfile.accountPurpose}
            onChange={(event) =>
              updateSection("bankingProfile", "accountPurpose", event.target.value)
            }
            placeholder="Describe expected receipts, disbursements, payroll, and treasury use."
            required
          />

          <div className="option-grid">
            {workspace.productOptions.map((product) => (
              <OptionCard
                key={product}
                title={product}
                detail="Requested service"
                checked={workspace.bankingProfile.requestedProducts.includes(product)}
                onChange={() => toggleProduct(product)}
              />
            ))}
          </div>

          <div className="form-grid">
            <TextField
              label="Expected opening deposit (USD)"
              value={workspace.bankingProfile.expectedOpeningDeposit}
              onChange={(event) =>
                updateSection(
                  "bankingProfile",
                  "expectedOpeningDeposit",
                  event.target.value,
                )
              }
              placeholder="250000"
              required
            />
            <TextField
              label="Estimated monthly incoming volume (USD)"
              value={workspace.bankingProfile.monthlyIncoming}
              onChange={(event) =>
                updateSection("bankingProfile", "monthlyIncoming", event.target.value)
              }
              placeholder="900000"
              required
            />
            <TextField
              label="Estimated monthly outgoing volume (USD)"
              value={workspace.bankingProfile.monthlyOutgoing}
              onChange={(event) =>
                updateSection("bankingProfile", "monthlyOutgoing", event.target.value)
              }
              placeholder="720000"
              required
            />
            <TextField
              label="Number of online banking users"
              value={workspace.bankingProfile.onlineBankingUsers}
              onChange={(event) =>
                updateSection("bankingProfile", "onlineBankingUsers", event.target.value)
              }
              placeholder="2"
            />
            <TextField
              label="Foreign jurisdictions involved"
              value={workspace.bankingProfile.jurisdictionsInScope}
              onChange={(event) =>
                updateSection(
                  "bankingProfile",
                  "jurisdictionsInScope",
                  event.target.value,
                )
              }
              placeholder="Canada, United Kingdom"
            />
          </div>

          <div className="inline-toggles">
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={workspace.bankingProfile.internationalActivity}
                onChange={(event) =>
                  updateSection(
                    "bankingProfile",
                    "internationalActivity",
                    event.target.checked,
                  )
                }
              />
              <span>The business expects international transactions.</span>
            </label>
            <label className="inline-toggle">
              <input
                type="checkbox"
                checked={workspace.bankingProfile.needsCommercialCards}
                onChange={(event) =>
                  updateSection(
                    "bankingProfile",
                    "needsCommercialCards",
                    event.target.checked,
                  )
                }
              />
              <span>Commercial debit or spending cards are required.</span>
            </label>
          </div>
        </section>
      </>
    );
  }

  function renderOwnershipSection() {
    return (
      <>
        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Ownership and control</p>
              <h3>List beneficial owners and authorized signers</h3>
              <p>
                Include each individual who owns 25% or more, controls the business,
                or will sign on the account.
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={addOwner}>
              Add owner
            </button>
          </div>

          <div className="owner-stack">
            {workspace.beneficialOwners.map((owner, index) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                index={index}
                canRemove={workspace.beneficialOwners.length > 1}
                onFieldChange={(field, value) => updateOwner(owner.id, field, value)}
                onToggleSigner={(event) =>
                  updateOwner(owner.id, "isAuthorizedSigner", event.target.checked)
                }
                onRemove={() => removeOwner(owner.id)}
              />
            ))}
          </div>
        </section>
      </>
    );
  }

  function renderDocumentSection() {
    return (
      <>
        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Supporting documents</p>
              <h3>Confirm the documents you can provide with the application</h3>
              <p>
                Mark each item that is ready or will be delivered as part of the
                opening package.
              </p>
            </div>
          </div>

          <div className="option-grid">
            {workspace.documentOptions.map((document) => (
              <OptionCard
                key={document.key}
                title={document.title}
                detail={document.detail}
                checked={workspace.documents[document.key]}
                onChange={() => toggleDocument(document.key)}
              />
            ))}
          </div>
        </section>

        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Declarations</p>
              <h3>Review and confirm the final certifications</h3>
            </div>
          </div>

          <div className="option-list">
            {workspace.declarationOptions.map((declaration) => (
              <OptionCard
                key={declaration.key}
                title={declaration.title}
                detail={declaration.detail}
                checked={workspace.declarations[declaration.key]}
                onChange={() => toggleDeclaration(declaration.key)}
              />
            ))}
          </div>

          <TextAreaField
            label="Additional notes"
            value={workspace.additionalNotes}
            onChange={(event) => updateTopLevel("additionalNotes", event.target.value)}
            placeholder="Optional notes for the onboarding or treasury implementation team."
          />
        </section>
      </>
    );
  }

  function renderActiveSection() {
    switch (workspace.activeStep) {
      case "company":
        return renderCompanySection();
      case "contact":
        return renderContactSection();
      case "banking":
        return renderBankingSection();
      case "ownership":
        return renderOwnershipSection();
      case "documents":
        return renderDocumentSection();
      default:
        return renderCompanySection();
    }
  }

  return (
    <div className="application-shell">
      <header className="hero-panel">
        <div className="hero-copy">
          <p className="brand-mark">{workspace.brandName}</p>
          <h1>{workspace.formTitle}</h1>
          <p>{workspace.intro}</p>
        </div>
        <div className="hero-meta">
          <SummaryChip label="Completion" value={`${completionPercentage}%`} tone="accent" />
          <SummaryChip label="Status" value={backendLabel} />
          <SummaryChip label="Last sync" value={lastSyncedLabel} />
        </div>
      </header>

      <div className="workspace-layout">
        <aside className="step-rail">
          <div className="rail-block">
            <p className="section-eyebrow">Application steps</p>
            <h2>Required business information</h2>
            <p>{statusMessage}</p>
          </div>

          <div className="step-list">
            {workspace.steps.map((step) => (
              <StepButton
                key={step.id}
                step={step}
                active={step.id === workspace.activeStep}
                meta={`${sectionCompletion[step.id].complete}/${sectionCompletion[step.id].total}`}
                onClick={handleStepChange}
              />
            ))}
          </div>

          <div className="rail-block note-block">
            <p className="section-eyebrow">Need help?</p>
            <p>
              Contact the onboarding team at <strong>{workspace.supportEmail}</strong> if
              you need help with documentation or authorized signer requirements.
            </p>
          </div>
        </aside>

        <main className="form-stage">
          <section className="stage-banner">
            <div>
              <p className="section-eyebrow">
                Step {currentStepIndex + 1} of {workspace.steps.length}
              </p>
              <h2>{currentStep.title}</h2>
              <p>{currentStep.detail}</p>
            </div>
            <div className="banner-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleSave}
                disabled={saveState === "saving"}
              >
                {saveLabel}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleStepChange(nextStep.id)}
              >
                Continue
              </button>
            </div>
          </section>

          <div className="section-stack">{renderActiveSection()}</div>

          <section className="navigation-bar">
            <button
              type="button"
              className="ghost-button"
              onClick={() => handleStepChange(previousStep.id)}
              disabled={currentStepIndex === 0}
            >
              Previous section
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => handleStepChange(nextStep.id)}
            >
              {currentStepIndex === workspace.steps.length - 1
                ? "Review application"
                : `Next: ${nextStep.label}`}
            </button>
          </section>
        </main>

        <aside className="summary-panel">
          <div className="summary-card">
            <p className="section-eyebrow">Application overview</p>
            <h3>Submission readiness</h3>
            <div className="progress-bar">
              <span style={{ width: `${completionPercentage}%` }} />
            </div>
            <p className="progress-copy">
              {completedSections} of {workspace.steps.length} sections completed
            </p>
          </div>

          <div className="summary-card">
            <p className="section-eyebrow">Snapshot</p>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Applicant</span>
                <strong>
                  {workspace.companyInfo.legalName || "Not provided yet"}
                </strong>
              </div>
              <div className="summary-row">
                <span>Primary contact</span>
                <strong>
                  {workspace.primaryContact.fullName || "Not provided yet"}
                </strong>
              </div>
              <div className="summary-row">
                <span>Products selected</span>
                <strong>{workspace.bankingProfile.requestedProducts.length}</strong>
              </div>
              <div className="summary-row">
                <span>Owners listed</span>
                <strong>{workspace.beneficialOwners.length}</strong>
              </div>
              <div className="summary-row">
                <span>Documents marked ready</span>
                <strong>{Object.values(workspace.documents).filter(Boolean).length}</strong>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <p className="section-eyebrow">Outstanding items</p>
            <div className="issue-list">
              {missingItems.map((item) => (
                <div key={item} className="issue-item">
                  <span className="issue-dot" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
              {!missingItems.length ? (
                <div className="issue-item complete">
                  <span className="issue-dot" aria-hidden="true" />
                  <p>The application includes the core information required for review.</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
