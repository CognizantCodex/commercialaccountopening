import { startTransition, useEffect, useRef, useState } from "react";
import { loadWorkspace, saveWorkspace, submitWorkspace } from "./api";
import { defaultWorkspace } from "./defaultWorkspace";

const PHONE_DIGIT_LIMIT = 10;
const POSTAL_CODE_DIGIT_LIMIT = 5;
const EXTENSION_DIGIT_LIMIT = 6;
const EIN_DIGIT_LIMIT = 9;
const MONEY_DIGIT_LIMIT = 12;
const COUNT_DIGIT_LIMIT = 6;
const OWNERSHIP_PERCENT_DECIMAL_LIMIT = 2;
const OWNERSHIP_PERCENT_WHOLE_LIMIT = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function sanitizeDigits(value, maxLength) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLength);
}

function sanitizePhoneNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length === PHONE_DIGIT_LIMIT + 1 && digits.startsWith("1")) {
    return digits.slice(1, PHONE_DIGIT_LIMIT + 1);
  }

  return digits.slice(0, PHONE_DIGIT_LIMIT);
}

function sanitizePostalCode(value) {
  return sanitizeDigits(value, POSTAL_CODE_DIGIT_LIMIT);
}

function sanitizeExtension(value) {
  return sanitizeDigits(value, EXTENSION_DIGIT_LIMIT);
}

function sanitizeEin(value) {
  const digits = sanitizeDigits(value, EIN_DIGIT_LIMIT);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

function sanitizeWholeNumber(value, maxLength = COUNT_DIGIT_LIMIT) {
  return sanitizeDigits(value, maxLength);
}

function sanitizeCurrencyAmount(value) {
  return sanitizeWholeNumber(value, MONEY_DIGIT_LIMIT);
}

function sanitizePercentage(value) {
  const normalizedValue = String(value ?? "").replace(/[^\d.]/g, "");

  if (!normalizedValue) {
    return "";
  }

  const [wholePart = "", ...decimalParts] = normalizedValue.split(".");
  const limitedWholePart = wholePart.slice(0, OWNERSHIP_PERCENT_WHOLE_LIMIT);
  const limitedDecimalPart = decimalParts
    .join("")
    .slice(0, OWNERSHIP_PERCENT_DECIMAL_LIMIT);

  if (!limitedWholePart && !limitedDecimalPart) {
    return "";
  }

  const numericWholePart = Number.parseInt(limitedWholePart || "0", 10);
  if (numericWholePart > 100) {
    return "100";
  }

  if (numericWholePart === 100) {
    return "100";
  }

  if (!decimalParts.length) {
    return limitedWholePart;
  }

  return `${limitedWholePart || "0"}.${limitedDecimalPart}`;
}

function isValidWebsite(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return false;
  }

  const candidateUrl = /^https?:\/\//i.test(normalizedValue)
    ? normalizedValue
    : `https://${normalizedValue}`;

  try {
    const url = new URL(candidateUrl);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function mergeWorkspace(candidate = {}) {
  const companyInfo = {
    ...defaultWorkspace.companyInfo,
    ...(candidate.companyInfo ?? {}),
  };
  const primaryContact = {
    ...defaultWorkspace.primaryContact,
    ...(candidate.primaryContact ?? {}),
  };
  const addresses = {
    ...defaultWorkspace.addresses,
    ...(candidate.addresses ?? {}),
  };
  const bankingProfile = {
    ...defaultWorkspace.bankingProfile,
    ...(candidate.bankingProfile ?? {}),
    requestedProducts:
      candidate.bankingProfile?.requestedProducts?.length
        ? candidate.bankingProfile.requestedProducts
        : defaultWorkspace.bankingProfile.requestedProducts,
  };
  const submission = {
    ...defaultWorkspace.submission,
    ...(candidate.submission ?? {}),
  };
  const orchestration = {
    ...defaultWorkspace.orchestration,
    ...(candidate.orchestration ?? {}),
    checks: {
      ...defaultWorkspace.orchestration.checks,
      ...(candidate.orchestration?.checks ?? {}),
      kyc: {
        ...defaultWorkspace.orchestration.checks.kyc,
        ...(candidate.orchestration?.checks?.kyc ?? {}),
      },
      aml: {
        ...defaultWorkspace.orchestration.checks.aml,
        ...(candidate.orchestration?.checks?.aml ?? {}),
      },
      documentProcessing: {
        ...defaultWorkspace.orchestration.checks.documentProcessing,
        ...(candidate.orchestration?.checks?.documentProcessing ?? {}),
      },
      risk: {
        ...defaultWorkspace.orchestration.checks.risk,
        ...(candidate.orchestration?.checks?.risk ?? {}),
      },
    },
    integrations: {
      ...defaultWorkspace.orchestration.integrations,
      ...(candidate.orchestration?.integrations ?? {}),
    },
  };

  return {
    ...defaultWorkspace,
    ...candidate,
    companyInfo: {
      ...companyInfo,
      taxId: sanitizeEin(companyInfo.taxId),
      annualRevenue: sanitizeCurrencyAmount(companyInfo.annualRevenue),
      employeeCount: sanitizeWholeNumber(companyInfo.employeeCount),
      website: String(companyInfo.website ?? "").trim(),
    },
    primaryContact: {
      ...primaryContact,
      phone: sanitizePhoneNumber(primaryContact.phone),
      extension: sanitizeExtension(primaryContact.extension),
      email: String(primaryContact.email ?? "").trim(),
    },
    addresses: {
      ...addresses,
      postalCode: sanitizePostalCode(addresses.postalCode),
      operatingPostalCode: sanitizePostalCode(addresses.operatingPostalCode),
    },
    bankingProfile: {
      ...bankingProfile,
      expectedOpeningDeposit: sanitizeCurrencyAmount(
        bankingProfile.expectedOpeningDeposit,
      ),
      monthlyIncoming: sanitizeCurrencyAmount(bankingProfile.monthlyIncoming),
      monthlyOutgoing: sanitizeCurrencyAmount(bankingProfile.monthlyOutgoing),
      onlineBankingUsers: sanitizeWholeNumber(bankingProfile.onlineBankingUsers),
    },
    submission,
    orchestration,
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
    stateOptions:
      candidate.stateOptions?.length
        ? candidate.stateOptions
        : defaultWorkspace.stateOptions,
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
            email: String(owner.email ?? "").trim(),
            phone: sanitizePhoneNumber(owner.phone),
            ownershipPercentage: sanitizePercentage(owner.ownershipPercentage),
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

function getRequiredError(label, value) {
  return isFilled(value) ? "" : `${label} is required.`;
}

function getEmailError(label, value, required = false) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return EMAIL_PATTERN.test(normalizedValue)
    ? ""
    : `Enter a valid ${label.toLowerCase()}.`;
}

function getPhoneError(label, value, required = false) {
  const normalizedValue = sanitizePhoneNumber(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return normalizedValue.length === PHONE_DIGIT_LIMIT
    ? ""
    : `${label} must be 10 digits.`;
}

function getPostalCodeError(label, value, required = false) {
  const normalizedValue = sanitizePostalCode(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return normalizedValue.length === POSTAL_CODE_DIGIT_LIMIT
    ? ""
    : `${label} must be 5 digits.`;
}

function getEinError(label, value, required = false) {
  const normalizedValue = sanitizeDigits(value, EIN_DIGIT_LIMIT);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return normalizedValue.length === EIN_DIGIT_LIMIT
    ? ""
    : `${label} must be 9 digits.`;
}

function getWebsiteError(label, value) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return "";
  }

  return isValidWebsite(normalizedValue)
    ? ""
    : `Enter a valid ${label.toLowerCase()}.`;
}

function getWholeNumberError(label, value, required = false) {
  const normalizedValue = sanitizeWholeNumber(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return Number.parseInt(normalizedValue, 10) > 0
    ? ""
    : `${label} must be greater than 0.`;
}

function getCurrencyError(label, value, required = false) {
  const normalizedValue = sanitizeCurrencyAmount(value);

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  return Number.parseInt(normalizedValue, 10) > 0
    ? ""
    : `${label} must be greater than 0.`;
}

function getPercentageError(label, value, required = false) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
  }

  const numericValue = Number.parseFloat(normalizedValue);
  if (Number.isNaN(numericValue)) {
    return `Enter a valid ${label.toLowerCase()}.`;
  }

  return numericValue > 0 && numericValue <= 100
    ? ""
    : `${label} must be between 0 and 100.`;
}

function buildValidationErrors(workspace) {
  const errors = {};

  const companyRequiredFields = [
    ["companyInfo.legalName", "Legal entity name", workspace.companyInfo.legalName],
    [
      "companyInfo.registrationNumber",
      "Registration number",
      workspace.companyInfo.registrationNumber,
    ],
    [
      "companyInfo.incorporationDate",
      "Date of incorporation",
      workspace.companyInfo.incorporationDate,
    ],
    [
      "companyInfo.incorporationState",
      "State of registration",
      workspace.companyInfo.incorporationState,
    ],
    ["companyInfo.industry", "Primary industry", workspace.companyInfo.industry],
  ];

  companyRequiredFields.forEach(([key, label, value]) => {
    const error = getRequiredError(label, value);
    if (error) {
      errors[key] = error;
    }
  });

  const companyFormatErrors = [
    [
      "companyInfo.taxId",
      getEinError("Federal tax ID / EIN", workspace.companyInfo.taxId, true),
    ],
    [
      "companyInfo.website",
      getWebsiteError("Website", workspace.companyInfo.website),
    ],
    [
      "companyInfo.annualRevenue",
      getCurrencyError("Annual revenue", workspace.companyInfo.annualRevenue),
    ],
    [
      "companyInfo.employeeCount",
      getWholeNumberError("Employee count", workspace.companyInfo.employeeCount),
    ],
  ];

  companyFormatErrors.forEach(([key, error]) => {
    if (error) {
      errors[key] = error;
    }
  });

  const primaryContactErrors = [
    ["primaryContact.fullName", getRequiredError("Full name", workspace.primaryContact.fullName)],
    [
      "primaryContact.email",
      getEmailError("Primary contact email", workspace.primaryContact.email, true),
    ],
    [
      "primaryContact.phone",
      getPhoneError("Primary contact phone", workspace.primaryContact.phone, true),
    ],
    [
      "primaryContact.extension",
      getWholeNumberError("Extension", workspace.primaryContact.extension),
    ],
  ];

  primaryContactErrors.forEach(([key, error]) => {
    if (error) {
      errors[key] = error;
    }
  });

  const registeredAddressErrors = [
    ["addresses.registeredLine1", getRequiredError("Registered address line 1", workspace.addresses.registeredLine1)],
    ["addresses.city", getRequiredError("Registered city", workspace.addresses.city)],
    ["addresses.state", getRequiredError("Registered state", workspace.addresses.state)],
    [
      "addresses.postalCode",
      getPostalCodeError("Registered ZIP code", workspace.addresses.postalCode, true),
    ],
  ];

  registeredAddressErrors.forEach(([key, error]) => {
    if (error) {
      errors[key] = error;
    }
  });

  if (!workspace.addresses.operatingSameAsRegistered) {
    const operatingAddressErrors = [
      [
        "addresses.operatingLine1",
        getRequiredError("Operating address line 1", workspace.addresses.operatingLine1),
      ],
      [
        "addresses.operatingCity",
        getRequiredError("Operating city", workspace.addresses.operatingCity),
      ],
      [
        "addresses.operatingState",
        getRequiredError("Operating state", workspace.addresses.operatingState),
      ],
      [
        "addresses.operatingPostalCode",
        getPostalCodeError(
          "Operating ZIP code",
          workspace.addresses.operatingPostalCode,
          true,
        ),
      ],
    ];

    operatingAddressErrors.forEach(([key, error]) => {
      if (error) {
        errors[key] = error;
      }
    });
  }

  const bankingErrors = [
    [
      "bankingProfile.accountPurpose",
      getRequiredError(
        "Primary purpose of the account",
        workspace.bankingProfile.accountPurpose,
      ),
    ],
    [
      "bankingProfile.expectedOpeningDeposit",
      getCurrencyError(
        "Expected opening deposit",
        workspace.bankingProfile.expectedOpeningDeposit,
        true,
      ),
    ],
    [
      "bankingProfile.monthlyIncoming",
      getCurrencyError(
        "Estimated monthly incoming volume",
        workspace.bankingProfile.monthlyIncoming,
        true,
      ),
    ],
    [
      "bankingProfile.monthlyOutgoing",
      getCurrencyError(
        "Estimated monthly outgoing volume",
        workspace.bankingProfile.monthlyOutgoing,
        true,
      ),
    ],
    [
      "bankingProfile.onlineBankingUsers",
      getWholeNumberError(
        "Number of online banking users",
        workspace.bankingProfile.onlineBankingUsers,
      ),
    ],
  ];

  bankingErrors.forEach(([key, error]) => {
    if (error) {
      errors[key] = error;
    }
  });

  if (!workspace.bankingProfile.requestedProducts.length) {
    errors["bankingProfile.requestedProducts"] =
      "Select at least one account or treasury product.";
  }

  workspace.beneficialOwners.forEach((owner, index) => {
    const ownerPrefix = `beneficialOwners.${owner.id}`;
    const ownerLabel = `Owner ${index + 1}`;
    const ownerErrors = [
      [`${ownerPrefix}.fullName`, getRequiredError(`${ownerLabel} full name`, owner.fullName)],
      [`${ownerPrefix}.title`, getRequiredError(`${ownerLabel} title`, owner.title)],
      [
        `${ownerPrefix}.ownershipPercentage`,
        getPercentageError(
          `${ownerLabel} ownership percentage`,
          owner.ownershipPercentage,
          true,
        ),
      ],
      [`${ownerPrefix}.email`, getEmailError(`${ownerLabel} email`, owner.email)],
      [`${ownerPrefix}.phone`, getPhoneError(`${ownerLabel} phone`, owner.phone)],
    ];

    ownerErrors.forEach(([key, error]) => {
      if (error) {
        errors[key] = error;
      }
    });
  });

  if (!workspace.beneficialOwners.some((owner) => owner.isAuthorizedSigner)) {
    errors["beneficialOwners.authorizedSigner"] =
      "Select at least one beneficial owner as an authorized signer.";
  }

  if (Object.values(workspace.documents ?? {}).filter(Boolean).length < 3) {
    errors.documents = "Mark at least three supporting documents as ready.";
  }

  workspace.declarationOptions.forEach((declaration) => {
    if (declaration.required && !workspace.declarations[declaration.key]) {
      errors[`declarations.${declaration.key}`] = declaration.title;
    }
  });

  return errors;
}

function getStepFieldKeys(stepId, workspace) {
  switch (stepId) {
    case "company":
      return [
        "companyInfo.legalName",
        "companyInfo.registrationNumber",
        "companyInfo.taxId",
        "companyInfo.incorporationDate",
        "companyInfo.incorporationState",
        "companyInfo.industry",
        "companyInfo.website",
        "companyInfo.annualRevenue",
        "companyInfo.employeeCount",
      ];
    case "contact":
      return [
        "primaryContact.fullName",
        "primaryContact.email",
        "primaryContact.phone",
        "primaryContact.extension",
        "addresses.registeredLine1",
        "addresses.city",
        "addresses.state",
        "addresses.postalCode",
        ...(workspace.addresses.operatingSameAsRegistered
          ? []
          : [
              "addresses.operatingLine1",
              "addresses.operatingCity",
              "addresses.operatingState",
              "addresses.operatingPostalCode",
            ]),
      ];
    case "banking":
      return [
        "bankingProfile.accountPurpose",
        "bankingProfile.requestedProducts",
        "bankingProfile.expectedOpeningDeposit",
        "bankingProfile.monthlyIncoming",
        "bankingProfile.monthlyOutgoing",
        "bankingProfile.onlineBankingUsers",
      ];
    case "ownership":
      return [
        ...workspace.beneficialOwners.flatMap((owner) => [
          `beneficialOwners.${owner.id}.fullName`,
          `beneficialOwners.${owner.id}.title`,
          `beneficialOwners.${owner.id}.ownershipPercentage`,
          `beneficialOwners.${owner.id}.email`,
          `beneficialOwners.${owner.id}.phone`,
        ]),
        "beneficialOwners.authorizedSigner",
      ];
    case "documents":
      return [
        "documents",
        ...workspace.declarationOptions
          .filter((declaration) => declaration.required)
          .map((declaration) => `declarations.${declaration.key}`),
      ];
    default:
      return [];
  }
}

function getFieldValue(workspace, fieldKey) {
  return fieldKey
    .split(".")
    .reduce((currentValue, key) => currentValue?.[key], workspace);
}

function formatDecision(value) {
  return String(value ?? "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function ReviewCheckCard({ check }) {
  const checkKyc = check.integration?.checkKyc;
  const checkRisk = check.integration?.checkRisk;

  return (
    <article className="review-check-card">
      <div className="review-check-header">
        <div>
          <p className="section-eyebrow">{check.label}</p>
          <h4>{formatDecision(check.decision)}</h4>
        </div>
        {check.score !== null ? <strong>{check.score}/100</strong> : null}
      </div>
      <p>{check.summary}</p>
      {check.flags?.length ? (
        <div className="review-check-flags">
          {check.flags.map((flag) => (
            <p key={flag}>{flag}</p>
          ))}
        </div>
      ) : (
        <div className="review-check-flags empty">
          <p>No review flags were raised.</p>
        </div>
      )}
      {checkKyc ? (
        <div className="integration-callout">
          <p>
            CheckKYC API: <strong>{checkKyc.transmissionMode}</strong>
          </p>
          <p>
            External application ID:{" "}
            <strong>
              {checkKyc.externalApplicationId ?? "Pending external response"}
            </strong>
          </p>
          <p>Response: <strong>{checkKyc.response}</strong></p>
          {checkKyc.errorMessage ? <p>{checkKyc.errorMessage}</p> : null}
          <p>{checkKyc.message}</p>
        </div>
      ) : null}
      {checkRisk ? (
        <div className="integration-callout">
          <p>
            checkRisk API: <strong>{checkRisk.transmissionMode}</strong>
          </p>
          <p>
            External assessment ID:{" "}
            <strong>
              {checkRisk.externalAssessmentId ?? "Pending external response"}
            </strong>
          </p>
          <p>Response: <strong>{checkRisk.response}</strong></p>
          {checkRisk.riskScore !== null ? (
            <p>
              Risk score: <strong>{checkRisk.riskScore}</strong>
            </p>
          ) : null}
          {checkRisk.recommendation ? <p>{checkRisk.recommendation}</p> : null}
          <p>{checkRisk.message}</p>
        </div>
      ) : null}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  onBlur,
  error = "",
  inputMode,
  maxLength,
  autoComplete,
}) {
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
      {error ? <small className="field-error-copy">{error}</small> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
  onBlur,
  error = "",
  placeholder,
}) {
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <select
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        aria-invalid={Boolean(error)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <small className="field-error-copy">{error}</small> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  onBlur,
  error = "",
}) {
  return (
    <label className={`field field-textarea${error ? " has-error" : ""}`}>
      <span>
        {label}
        {required ? <small>Required</small> : null}
      </span>
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
      />
      {error ? <small className="field-error-copy">{error}</small> : null}
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

function OwnerCard({
  owner,
  index,
  onFieldChange,
  onToggleSigner,
  onRemove,
  canRemove,
  onFieldBlur,
  getFieldError,
}) {
  const ownerFieldPrefix = `beneficialOwners.${owner.id}`;

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
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.fullName`)}
          error={getFieldError(`${ownerFieldPrefix}.fullName`)}
          placeholder="Full legal name"
          autoComplete="name"
          required
        />
        <TextField
          label="Title"
          value={owner.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.title`)}
          error={getFieldError(`${ownerFieldPrefix}.title`)}
          placeholder="Role or title"
          required
        />
        <TextField
          label="Ownership %"
          value={owner.ownershipPercentage}
          onChange={(event) =>
            onFieldChange(
              "ownershipPercentage",
              sanitizePercentage(event.target.value),
            )
          }
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.ownershipPercentage`)}
          error={getFieldError(`${ownerFieldPrefix}.ownershipPercentage`)}
          placeholder="25"
          inputMode="decimal"
          required
        />
        <TextField
          label="Email"
          type="email"
          value={owner.email}
          onChange={(event) => onFieldChange("email", event.target.value)}
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.email`)}
          error={getFieldError(`${ownerFieldPrefix}.email`)}
          placeholder="name@company.com"
          autoComplete="email"
        />
        <TextField
          label="Phone"
          value={owner.phone}
          onChange={(event) =>
            onFieldChange("phone", sanitizePhoneNumber(event.target.value))
          }
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.phone`)}
          error={getFieldError(`${ownerFieldPrefix}.phone`)}
          placeholder="4155550123"
          inputMode="numeric"
          maxLength={PHONE_DIGIT_LIMIT}
          autoComplete="tel"
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
  const [submitState, setSubmitState] = useState("idle");
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
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
  const validationErrors = buildValidationErrors(workspace);
  const currentStepFieldKeys = getStepFieldKeys(workspace.activeStep, workspace);
  const allSubmissionFieldKeys = [
    ...new Set(
      workspace.steps.flatMap((step) => getStepFieldKeys(step.id, workspace)),
    ),
  ];
  const orchestrationChecks = Object.values(workspace.orchestration.checks);
  const currentStepValidationMessages = [
    ...new Set(
      currentStepFieldKeys
        .map((fieldKey) => (touchedFields[fieldKey] ? validationErrors[fieldKey] : ""))
        .filter(Boolean),
    ),
  ];

  useEffect(() => {
    if (
      !hasBootstrapped ||
      !hasUnsavedChanges ||
      submitState === "submitting" ||
      saveState !== "idle" ||
      currentStepFieldKeys.some((fieldKey) => {
        const fieldValue = getFieldValue(workspace, fieldKey);
        return isFilled(fieldValue) && Boolean(validationErrors[fieldKey]);
      })
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void persistWorkspace("auto");
    }, 900);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    workspace,
    hasBootstrapped,
    hasUnsavedChanges,
    submitState,
    saveState,
    currentStepFieldKeys,
    validationErrors,
  ]);

  function isCompletedField(fieldKey, value) {
    return isFilled(value) && !validationErrors[fieldKey];
  }

  const sectionCompletion = {
    company: {
      complete: [
        isCompletedField("companyInfo.legalName", workspace.companyInfo.legalName),
        isCompletedField(
          "companyInfo.registrationNumber",
          workspace.companyInfo.registrationNumber,
        ),
        isCompletedField("companyInfo.taxId", workspace.companyInfo.taxId),
        isCompletedField(
          "companyInfo.incorporationDate",
          workspace.companyInfo.incorporationDate,
        ),
        isCompletedField(
          "companyInfo.incorporationState",
          workspace.companyInfo.incorporationState,
        ),
        isCompletedField("companyInfo.industry", workspace.companyInfo.industry),
      ].filter(Boolean).length,
      total: 6,
    },
    contact: {
      complete: [
        isCompletedField("primaryContact.fullName", workspace.primaryContact.fullName),
        isCompletedField("primaryContact.email", workspace.primaryContact.email),
        isCompletedField("primaryContact.phone", workspace.primaryContact.phone),
        isCompletedField("addresses.registeredLine1", workspace.addresses.registeredLine1),
        isCompletedField("addresses.city", workspace.addresses.city),
        isCompletedField("addresses.state", workspace.addresses.state),
        isCompletedField("addresses.postalCode", workspace.addresses.postalCode),
      ].filter(Boolean).length,
      total: 7,
    },
    banking: {
      complete: [
        isCompletedField(
          "bankingProfile.accountPurpose",
          workspace.bankingProfile.accountPurpose,
        ),
        !validationErrors["bankingProfile.requestedProducts"],
        isCompletedField(
          "bankingProfile.expectedOpeningDeposit",
          workspace.bankingProfile.expectedOpeningDeposit,
        ),
        isCompletedField(
          "bankingProfile.monthlyIncoming",
          workspace.bankingProfile.monthlyIncoming,
        ),
        isCompletedField(
          "bankingProfile.monthlyOutgoing",
          workspace.bankingProfile.monthlyOutgoing,
        ),
      ].filter(Boolean).length,
      total: 5,
    },
    ownership: {
      complete: [
        workspace.beneficialOwners.some(
          (owner) =>
            isFilled(owner.fullName) &&
            isFilled(owner.title) &&
            isFilled(owner.ownershipPercentage) &&
            !validationErrors[`beneficialOwners.${owner.id}.fullName`] &&
            !validationErrors[`beneficialOwners.${owner.id}.title`] &&
            !validationErrors[`beneficialOwners.${owner.id}.ownershipPercentage`],
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
  if (validationErrors["companyInfo.legalName"]) {
    missingItems.push("Enter the full legal entity name.");
  }
  if (validationErrors["companyInfo.taxId"]) {
    missingItems.push("Provide the federal tax ID / EIN.");
  }
  if (validationErrors["companyInfo.incorporationState"]) {
    missingItems.push("Select the state of registration.");
  }
  if (validationErrors["primaryContact.email"]) {
    missingItems.push(validationErrors["primaryContact.email"]);
  }
  if (validationErrors["primaryContact.phone"]) {
    missingItems.push(validationErrors["primaryContact.phone"]);
  }
  if (validationErrors["addresses.registeredLine1"]) {
    missingItems.push("Complete the registered business address.");
  }
  if (validationErrors["addresses.postalCode"]) {
    missingItems.push(validationErrors["addresses.postalCode"]);
  }
  if (validationErrors["bankingProfile.accountPurpose"]) {
    missingItems.push("Describe the intended use of the account.");
  }
  if (validationErrors["bankingProfile.requestedProducts"]) {
    missingItems.push(validationErrors["bankingProfile.requestedProducts"]);
  }
  if (
    !workspace.beneficialOwners.some(
      (owner) =>
        isFilled(owner.fullName) &&
        isFilled(owner.title) &&
        isFilled(owner.ownershipPercentage),
    )
  ) {
    missingItems.push("Add at least one beneficial owner or control person.");
  }
  if (validationErrors["beneficialOwners.authorizedSigner"]) {
    missingItems.push(validationErrors["beneficialOwners.authorizedSigner"]);
  }
  if (validationErrors.documents) {
    missingItems.push(validationErrors.documents);
  }
  if (!workspace.declarations.confirmTerms) {
    missingItems.push("Review and accept the final declarations.");
  }

  const uniqueMissingItems = [...new Set(missingItems)];

  const lastSyncedLabel = formatTimestamp(workspace.lastUpdatedAt);
  const backendLabel =
    connectionState === "connected"
      ? "Workspace connected"
      : connectionState === "fallback"
        ? "Draft mode"
        : "Connecting";
  const submissionLabel =
    workspace.submission.status === "submitted"
      ? formatDecision(workspace.submission.overallDecision)
      : "Draft";
  const saveLabel =
    saveState === "saving"
      ? "Saving draft..."
      : saveState === "saved"
        ? "All changes saved"
        : "Save draft";
  const submitLabel =
    submitState === "submitting"
      ? "Submitting application..."
      : workspace.submission.status === "submitted"
        ? "Re-run orchestrator"
        : "Submit application";

  function markDirty() {
    saveVersionRef.current += 1;
    setHasUnsavedChanges(true);
    setSaveState("idle");
  }

  function markFieldsTouched(fieldKeys) {
    if (!fieldKeys.length) {
      return;
    }

    setTouchedFields((current) => {
      const nextTouchedFields = { ...current };

      fieldKeys.forEach((fieldKey) => {
        nextTouchedFields[fieldKey] = true;
      });

      return nextTouchedFields;
    });
  }

  function handleFieldBlur(fieldKey) {
    markFieldsTouched([fieldKey]);
  }

  function getFieldError(fieldKey) {
    return touchedFields[fieldKey] ? validationErrors[fieldKey] ?? "" : "";
  }

  function invalidateSubmission(current) {
    if (current.submission.status !== "submitted") {
      return current;
    }

    return {
      ...current,
      submission: {
        ...defaultWorkspace.submission,
        summary:
          "Changes were made after the last submission. Submit again to re-run KYC, AML, document processing, and risk review.",
        recommendedAction:
          "Submit the updated application to refresh the orchestrator decision.",
      },
      orchestration: {
        ...defaultWorkspace.orchestration,
        summary:
          "Changes were made after the last submission. Submit again to refresh the review pipeline.",
      },
    };
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
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        [section]: {
          ...current[section],
          [field]: value,
        },
      };
    });
    markDirty();
  }

  function updateTopLevel(field, value) {
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        [field]: value,
      };
    });
    markDirty();
  }

  function updateOwner(ownerId, field, value) {
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        beneficialOwners: current.beneficialOwners.map((owner) =>
          owner.id === ownerId ? { ...owner, [field]: value } : owner,
        ),
      };
    });
    markDirty();
  }

  function removeOwner(ownerId) {
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        beneficialOwners: current.beneficialOwners.filter(
          (owner) => owner.id !== ownerId,
        ),
      };
    });
    markDirty();
  }

  function addOwner() {
    startTransition(() => {
      setWorkspace((current) => {
        const nextWorkspace = invalidateSubmission(current);

        return {
          ...nextWorkspace,
          beneficialOwners: [...current.beneficialOwners, createOwner()],
        };
      });
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
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        bankingProfile: {
          ...current.bankingProfile,
          requestedProducts: current.bankingProfile.requestedProducts.includes(product)
            ? current.bankingProfile.requestedProducts.filter(
                (existing) => existing !== product,
              )
            : [...current.bankingProfile.requestedProducts, product],
        },
      };
    });
    markDirty();
  }

  function toggleDocument(key) {
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        documents: {
          ...current.documents,
          [key]: !current.documents[key],
        },
      };
    });
    markDirty();
  }

  function toggleDeclaration(key) {
    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        declarations: {
          ...current.declarations,
          [key]: !current.declarations[key],
        },
      };
    });
    markDirty();
  }

  async function handleSave() {
    markFieldsTouched(currentStepFieldKeys);

    if (currentStepFieldKeys.some((fieldKey) => validationErrors[fieldKey])) {
      setStatusMessage("Please fix the highlighted fields before saving this section.");
      return;
    }

    await persistWorkspace("manual");
  }

  async function handleSubmitApplication() {
    markFieldsTouched(allSubmissionFieldKeys);

    const firstInvalidStep = workspace.steps.find((step) =>
      getStepFieldKeys(step.id, workspace).some((fieldKey) => validationErrors[fieldKey]),
    );

    if (firstInvalidStep) {
      handleStepChange(firstInvalidStep.id);
      setStatusMessage(
        "Please complete the highlighted fields before submitting the application.",
      );
      return;
    }

    const versionAtRequest = saveVersionRef.current;
    const snapshot = workspace;

    setSubmitState("submitting");
    setStatusMessage(
      "Submitting the application to the onboarding orchestrator for KYC, AML, document processing, and risk review...",
    );

    try {
      const submittedWorkspace = await submitWorkspace(snapshot);
      const mergedWorkspace = mergeWorkspace(submittedWorkspace);

      setConnectionState("connected");
      setSaveState("saved");
      setSubmitState("submitted");

      if (saveVersionRef.current === versionAtRequest) {
        setWorkspace(mergedWorkspace);
        setHasUnsavedChanges(false);
      } else {
        setWorkspace((current) => ({
          ...current,
          submission: mergedWorkspace.submission,
          orchestration: mergedWorkspace.orchestration,
          lastUpdatedAt: mergedWorkspace.lastUpdatedAt,
        }));
      }

      setStatusMessage(
        "Application submitted. The orchestrator completed KYC, AML, document processing, and risk review.",
      );
    } catch (error) {
      setSubmitState("error");
      if (error?.status !== 400) {
        setConnectionState("fallback");
      }
      setStatusMessage(
        error?.payload?.issues?.[0]?.message ??
          error?.message ??
          "We couldn't submit the application right now. Please review the form and try again.",
      );
    }
  }

  function handleContinue() {
    const blockingErrors = currentStepFieldKeys.filter(
      (fieldKey) => validationErrors[fieldKey],
    );

    if (blockingErrors.length) {
      markFieldsTouched(currentStepFieldKeys);
      setStatusMessage(
        "Please complete the highlighted required fields before continuing.",
      );
      return;
    }

    if (currentStepIndex === workspace.steps.length - 1) {
      void handleSubmitApplication();
      return;
    }

    handleStepChange(nextStep.id);
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
              onBlur={() => handleFieldBlur("companyInfo.legalName")}
              error={getFieldError("companyInfo.legalName")}
              placeholder="Acme Holdings Corporation"
              autoComplete="organization"
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
              onBlur={() => handleFieldBlur("companyInfo.registrationNumber")}
              error={getFieldError("companyInfo.registrationNumber")}
              placeholder="State file / registration number"
              required
            />
            <TextField
              label="Federal tax ID / EIN"
              value={workspace.companyInfo.taxId}
              onChange={(event) =>
                updateSection("companyInfo", "taxId", sanitizeEin(event.target.value))
              }
              onBlur={() => handleFieldBlur("companyInfo.taxId")}
              error={getFieldError("companyInfo.taxId")}
              placeholder="12-3456789"
              inputMode="numeric"
              maxLength={10}
              required
            />
            <TextField
              label="Date of incorporation"
              type="date"
              value={workspace.companyInfo.incorporationDate}
              onChange={(event) =>
                updateSection("companyInfo", "incorporationDate", event.target.value)
              }
              onBlur={() => handleFieldBlur("companyInfo.incorporationDate")}
              error={getFieldError("companyInfo.incorporationDate")}
              required
            />
            <SelectField
              label="State of registration"
              value={workspace.companyInfo.incorporationState}
              onChange={(event) =>
                updateSection("companyInfo", "incorporationState", event.target.value)
              }
              onBlur={() => handleFieldBlur("companyInfo.incorporationState")}
              error={getFieldError("companyInfo.incorporationState")}
              options={workspace.stateOptions}
              placeholder="Select a state"
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
              value={workspace.companyInfo.industry}
              onChange={(event) =>
                updateSection("companyInfo", "industry", event.target.value)
              }
              onBlur={() => handleFieldBlur("companyInfo.industry")}
              error={getFieldError("companyInfo.industry")}
              options={workspace.industryOptions}
              placeholder="Select an industry"
              required
            />
            <TextField
              label="Website"
              value={workspace.companyInfo.website}
              onChange={(event) =>
                updateSection("companyInfo", "website", event.target.value)
              }
              onBlur={() => handleFieldBlur("companyInfo.website")}
              error={getFieldError("companyInfo.website")}
              placeholder="https://www.company.com"
              type="url"
              autoComplete="url"
            />
            <TextField
              label="Annual revenue (USD)"
              value={workspace.companyInfo.annualRevenue}
              onChange={(event) =>
                updateSection(
                  "companyInfo",
                  "annualRevenue",
                  sanitizeCurrencyAmount(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("companyInfo.annualRevenue")}
              error={getFieldError("companyInfo.annualRevenue")}
              placeholder="25000000"
              inputMode="numeric"
              maxLength={MONEY_DIGIT_LIMIT}
            />
            <TextField
              label="Employee count"
              value={workspace.companyInfo.employeeCount}
              onChange={(event) =>
                updateSection(
                  "companyInfo",
                  "employeeCount",
                  sanitizeWholeNumber(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("companyInfo.employeeCount")}
              error={getFieldError("companyInfo.employeeCount")}
              placeholder="120"
              inputMode="numeric"
              maxLength={COUNT_DIGIT_LIMIT}
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
              onBlur={() => handleFieldBlur("primaryContact.fullName")}
              error={getFieldError("primaryContact.fullName")}
              placeholder="Jordan Lee"
              autoComplete="name"
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
              onBlur={() => handleFieldBlur("primaryContact.email")}
              error={getFieldError("primaryContact.email")}
              placeholder="jordan.lee@company.com"
              autoComplete="email"
              required
            />
            <TextField
              label="Phone"
              value={workspace.primaryContact.phone}
              onChange={(event) =>
                updateSection(
                  "primaryContact",
                  "phone",
                  sanitizePhoneNumber(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("primaryContact.phone")}
              error={getFieldError("primaryContact.phone")}
              placeholder="4155550123"
              inputMode="numeric"
              maxLength={PHONE_DIGIT_LIMIT}
              autoComplete="tel"
              required
            />
            <TextField
              label="Extension"
              value={workspace.primaryContact.extension}
              onChange={(event) =>
                updateSection(
                  "primaryContact",
                  "extension",
                  sanitizeExtension(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("primaryContact.extension")}
              error={getFieldError("primaryContact.extension")}
              placeholder="204"
              inputMode="numeric"
              maxLength={EXTENSION_DIGIT_LIMIT}
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
              onBlur={() => handleFieldBlur("addresses.registeredLine1")}
              error={getFieldError("addresses.registeredLine1")}
              placeholder="100 Market Street"
              autoComplete="address-line1"
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
              onBlur={() => handleFieldBlur("addresses.city")}
              error={getFieldError("addresses.city")}
              placeholder="San Francisco"
              autoComplete="address-level2"
              required
            />
            <SelectField
              label="State"
              value={workspace.addresses.state}
              onChange={(event) =>
                updateSection("addresses", "state", event.target.value)
              }
              onBlur={() => handleFieldBlur("addresses.state")}
              error={getFieldError("addresses.state")}
              options={workspace.stateOptions}
              placeholder="Select a state"
              required
            />
            <TextField
              label="ZIP code"
              value={workspace.addresses.postalCode}
              onChange={(event) =>
                updateSection(
                  "addresses",
                  "postalCode",
                  sanitizePostalCode(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("addresses.postalCode")}
              error={getFieldError("addresses.postalCode")}
              placeholder="94105"
              inputMode="numeric"
              maxLength={POSTAL_CODE_DIGIT_LIMIT}
              autoComplete="postal-code"
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
                onBlur={() => handleFieldBlur("addresses.operatingLine1")}
                error={getFieldError("addresses.operatingLine1")}
                placeholder="250 Industrial Drive"
                autoComplete="address-line1"
                required
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
                onBlur={() => handleFieldBlur("addresses.operatingCity")}
                error={getFieldError("addresses.operatingCity")}
                placeholder="Oakland"
                autoComplete="address-level2"
                required
              />
              <SelectField
                label="Operating state"
                value={workspace.addresses.operatingState}
                onChange={(event) =>
                  updateSection("addresses", "operatingState", event.target.value)
                }
                onBlur={() => handleFieldBlur("addresses.operatingState")}
                error={getFieldError("addresses.operatingState")}
                options={workspace.stateOptions}
                placeholder="Select a state"
                required
              />
              <TextField
                label="Operating ZIP code"
                value={workspace.addresses.operatingPostalCode}
                onChange={(event) =>
                  updateSection(
                    "addresses",
                    "operatingPostalCode",
                    sanitizePostalCode(event.target.value),
                  )
                }
                onBlur={() => handleFieldBlur("addresses.operatingPostalCode")}
                error={getFieldError("addresses.operatingPostalCode")}
                placeholder="94607"
                inputMode="numeric"
                maxLength={POSTAL_CODE_DIGIT_LIMIT}
                autoComplete="postal-code"
                required
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
            onBlur={() => handleFieldBlur("bankingProfile.accountPurpose")}
            error={getFieldError("bankingProfile.accountPurpose")}
            placeholder="Describe expected receipts, disbursements, payroll, and treasury use."
            required
          />

          {getFieldError("bankingProfile.requestedProducts") ? (
            <p className="group-error-copy">{getFieldError("bankingProfile.requestedProducts")}</p>
          ) : null}

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
                  sanitizeCurrencyAmount(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("bankingProfile.expectedOpeningDeposit")}
              error={getFieldError("bankingProfile.expectedOpeningDeposit")}
              placeholder="250000"
              inputMode="numeric"
              maxLength={MONEY_DIGIT_LIMIT}
              required
            />
            <TextField
              label="Estimated monthly incoming volume (USD)"
              value={workspace.bankingProfile.monthlyIncoming}
              onChange={(event) =>
                updateSection(
                  "bankingProfile",
                  "monthlyIncoming",
                  sanitizeCurrencyAmount(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("bankingProfile.monthlyIncoming")}
              error={getFieldError("bankingProfile.monthlyIncoming")}
              placeholder="900000"
              inputMode="numeric"
              maxLength={MONEY_DIGIT_LIMIT}
              required
            />
            <TextField
              label="Estimated monthly outgoing volume (USD)"
              value={workspace.bankingProfile.monthlyOutgoing}
              onChange={(event) =>
                updateSection(
                  "bankingProfile",
                  "monthlyOutgoing",
                  sanitizeCurrencyAmount(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("bankingProfile.monthlyOutgoing")}
              error={getFieldError("bankingProfile.monthlyOutgoing")}
              placeholder="720000"
              inputMode="numeric"
              maxLength={MONEY_DIGIT_LIMIT}
              required
            />
            <TextField
              label="Number of online banking users"
              value={workspace.bankingProfile.onlineBankingUsers}
              onChange={(event) =>
                updateSection(
                  "bankingProfile",
                  "onlineBankingUsers",
                  sanitizeWholeNumber(event.target.value),
                )
              }
              onBlur={() => handleFieldBlur("bankingProfile.onlineBankingUsers")}
              error={getFieldError("bankingProfile.onlineBankingUsers")}
              placeholder="2"
              inputMode="numeric"
              maxLength={COUNT_DIGIT_LIMIT}
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

          {getFieldError("beneficialOwners.authorizedSigner") ? (
            <p className="group-error-copy">
              {getFieldError("beneficialOwners.authorizedSigner")}
            </p>
          ) : null}

          <div className="owner-stack">
            {workspace.beneficialOwners.map((owner, index) => (
              <OwnerCard
                key={owner.id}
                owner={owner}
                index={index}
                canRemove={workspace.beneficialOwners.length > 1}
                onFieldChange={(field, value) => updateOwner(owner.id, field, value)}
                onFieldBlur={handleFieldBlur}
                getFieldError={getFieldError}
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

          {getFieldError("documents") ? (
            <p className="group-error-copy">{getFieldError("documents")}</p>
          ) : null}

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

        <section className="form-card">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Onboarding orchestrator</p>
              <h3>Automated review pipeline</h3>
              <p>
                Submission triggers a single orchestrator workflow that runs KYC,
                AML, document processing, and risk review.
              </p>
            </div>
          </div>

          <div className="orchestration-summary">
            <div className="summary-row">
              <span>Submission status</span>
              <strong>{formatDecision(workspace.submission.status)}</strong>
            </div>
            <div className="summary-row">
              <span>Reference</span>
              <strong>{workspace.submission.referenceId ?? "Not submitted yet"}</strong>
            </div>
            <div className="summary-row">
              <span>Decision</span>
              <strong>{formatDecision(workspace.submission.overallDecision)}</strong>
            </div>
          </div>

          <p className="orchestration-copy">{workspace.submission.summary}</p>
          <p className="orchestration-copy subtle">
            {workspace.submission.recommendedAction}
          </p>

          <div className="review-check-grid">
            {orchestrationChecks.map((check) => (
              <ReviewCheckCard key={check.key} check={check} />
            ))}
          </div>
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
          <SummaryChip label="Submission" value={submissionLabel} />
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
                disabled={saveState === "saving" || submitState === "submitting"}
              >
                {saveLabel}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleContinue}
                disabled={submitState === "submitting"}
              >
                {currentStepIndex === workspace.steps.length - 1
                  ? submitLabel
                  : "Continue"}
              </button>
            </div>
          </section>

          {currentStepValidationMessages.length ? (
            <section className="validation-banner" aria-live="polite">
              <p className="section-eyebrow">Action needed</p>
              <strong>Please resolve the highlighted fields before continuing.</strong>
              <div className="validation-list">
                {currentStepValidationMessages.slice(0, 3).map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            </section>
          ) : null}

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
              onClick={handleContinue}
              disabled={submitState === "submitting"}
            >
              {currentStepIndex === workspace.steps.length - 1
                ? submitLabel
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
              <div className="summary-row">
                <span>Orchestrator decision</span>
                <strong>{formatDecision(workspace.submission.overallDecision)}</strong>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <p className="section-eyebrow">Review pipeline</p>
            <h3>Orchestrator checks</h3>
            <div className="summary-rows">
              {orchestrationChecks.map((check) => (
                <div key={check.key} className="summary-row">
                  <span>{check.label}</span>
                  <strong>{formatDecision(check.decision)}</strong>
                </div>
              ))}
            </div>
            <p className="progress-copy">{workspace.orchestration.summary}</p>
          </div>

          <div className="summary-card">
            <p className="section-eyebrow">Outstanding items</p>
            <div className="issue-list">
              {uniqueMissingItems.map((item) => (
                <div key={item} className="issue-item">
                  <span className="issue-dot" aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
              {!uniqueMissingItems.length ? (
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
