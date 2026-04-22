import { startTransition, useEffect, useId, useRef, useState } from "react";
import {
  listSubmittedApplications,
  listWorkspaceDrafts,
  loadWorkspace,
  saveWorkspace,
  submitWorkspace,
} from "./api";
import { defaultWorkspace } from "./defaultWorkspace";
import { TableInsertAssistant } from "./TableInsertAssistant";

const PHONE_DIGIT_LIMIT = 10;
const POSTAL_CODE_DIGIT_LIMIT = 5;
const EXTENSION_DIGIT_LIMIT = 6;
const EIN_DIGIT_LIMIT = 9;
const MONEY_DIGIT_LIMIT = 12;
const COUNT_DIGIT_LIMIT = 6;
const OWNERSHIP_PERCENT_DECIMAL_LIMIT = 2;
const OWNERSHIP_PERCENT_WHOLE_LIMIT = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KYC_FABRIC_URL = "/kyc-fabric/executive";
const KYC_FABRIC_PATH_PREFIX = "/kyc-fabric";
const KYC_FABRIC_APPLICATION_PATH = "/kyc-fabric/application";
const ADMIN_PATH = "/admin";

function formatRouteLabel(segment = "") {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getKycFabricContext(pathname = "/") {
  const isKycFabricExperience = pathname.startsWith(KYC_FABRIC_PATH_PREFIX);
  const routeSegment = isKycFabricExperience
    ? pathname.slice(KYC_FABRIC_PATH_PREFIX.length).replace(/^\/+/, "").split("/")[0]
    : "";

  return {
    isKycFabricExperience,
    routeLabel: routeSegment ? formatRouteLabel(routeSegment) : "Executive",
  };
}

function isEmbeddedApplicationRoute(pathname = "/") {
  return (
    pathname === KYC_FABRIC_APPLICATION_PATH ||
    pathname.startsWith(`${KYC_FABRIC_APPLICATION_PATH}/`)
  );
}

function isAdminRoute(pathname = "/") {
  return pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`);
}

function getRequestedDraftId() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("draft") ?? "";
}

function getCurrentView() {
  if (typeof window === "undefined") {
    return "form";
  }

  const requestedView = new URLSearchParams(window.location.search).get("view");

  if (requestedView === "drafts" || requestedView === "submitted") {
    return requestedView;
  }

  return "form";
}

function isReloadNavigation() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigationEntries = window.performance?.getEntriesByType?.("navigation");
  return navigationEntries?.[0]?.type === "reload";
}

function buildDraftPath(pathname, draftId) {
  if (!draftId) {
    return pathname;
  }

  return `${pathname}?${new URLSearchParams({ draft: draftId }).toString()}`;
}

function buildDraftBrowserPath(pathname) {
  return `${pathname}?${new URLSearchParams({ view: "drafts" }).toString()}`;
}

function buildSubmittedApplicationsPath(pathname) {
  return `${pathname}?${new URLSearchParams({ view: "submitted" }).toString()}`;
}

function syncDraftUrl(pathname, draftId) {
  if (!draftId || typeof window === "undefined") {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = pathname;
  nextUrl.search = "";
  nextUrl.searchParams.set("draft", draftId);
  nextUrl.hash = "";
  window.history.replaceState({}, "", nextUrl);
}

function resetToDefaultUrl(pathname) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = pathname;
  nextUrl.search = "";
  nextUrl.hash = "";
  window.history.replaceState({}, "", nextUrl);
}

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

function formatFileSize(sizeInBytes) {
  const size = Number(sizeInBytes ?? 0);

  if (!size) {
    return "0 KB";
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("File upload failed."));
    reader.readAsDataURL(file);
  });
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
    documentFiles: {
      ...defaultWorkspace.documentFiles,
      ...(candidate.documentFiles ?? {}),
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
    titleOptions:
      candidate.titleOptions?.length
        ? candidate.titleOptions
        : defaultWorkspace.titleOptions,
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

function mergeFailedKycResult(workspace, errorPayload = {}, fallbackMessage) {
  const integration = errorPayload?.integration ?? {};
  const message =
    errorPayload?.issues?.[0]?.message ??
    errorPayload?.error ??
    fallbackMessage ??
    "KYC Failed.";

  return mergeWorkspace({
    ...workspace,
    submission: {
      ...workspace.submission,
      status: "error",
      overallDecision: "kyc_failed",
      summary: message,
      recommendedAction:
        "Review the KYC response, correct the application details if needed, and submit again.",
    },
    orchestration: {
      ...workspace.orchestration,
      status: "failed",
      summary: "The onboarding orchestrator stopped after the KYC agent received a failed response.",
      checks: {
        ...workspace.orchestration.checks,
        kyc: {
          ...workspace.orchestration.checks.kyc,
          status: "failed",
          decision: "failed",
          summary: message,
          flags: [
            ...(workspace.orchestration.checks.kyc.flags ?? []),
            "CheckKYC returned a failed response for this application.",
          ],
          integration: {
            checkKyc: integration.checkKyc ?? null,
          },
        },
      },
      integrations: {
        ...workspace.orchestration.integrations,
        checkKyc: integration.checkKyc ?? null,
      },
    },
  });
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

function getWebsiteError(label, value, required = false) {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return required ? `${label} is required.` : "";
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
    ["companyInfo.entityType", "Entity type", workspace.companyInfo.entityType],
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
    [
      "companyInfo.incorporationCountry",
      "Country of registration",
      workspace.companyInfo.incorporationCountry,
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
      getWebsiteError("Website", workspace.companyInfo.website, true),
    ],
    [
      "companyInfo.annualRevenue",
      getCurrencyError("Annual revenue", workspace.companyInfo.annualRevenue, true),
    ],
    [
      "companyInfo.employeeCount",
      getWholeNumberError("Employee count", workspace.companyInfo.employeeCount, true),
    ],
  ];

  companyFormatErrors.forEach(([key, error]) => {
    if (error) {
      errors[key] = error;
    }
  });

  const primaryContactErrors = [
    ["primaryContact.fullName", getRequiredError("Full name", workspace.primaryContact.fullName)],
    ["primaryContact.title", getRequiredError("Title", workspace.primaryContact.title)],
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
    ["addresses.country", getRequiredError("Registered country", workspace.addresses.country)],
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
      [
        "addresses.operatingCountry",
        getRequiredError("Operating country", workspace.addresses.operatingCountry),
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
        true,
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
      [
        `${ownerPrefix}.email`,
        getEmailError(`${ownerLabel} email`, owner.email, true),
      ],
      [
        `${ownerPrefix}.phone`,
        getPhoneError(`${ownerLabel} phone`, owner.phone, true),
      ],
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

  workspace.documentOptions.forEach((document) => {
    if (workspace.documents?.[document.key] && !workspace.documentFiles?.[document.key]) {
      errors[`documents.${document.key}`] = `Add the ${document.title.toLowerCase()} file.`;
    }
  });

  if (Object.values(workspace.documents ?? {}).filter(Boolean).length < 3) {
    errors.documents = "Mark at least three supporting documents as ready.";
  } else if (
    workspace.documentOptions.some(
      (document) =>
        workspace.documents?.[document.key] && !workspace.documentFiles?.[document.key],
    )
  ) {
    errors.documents =
      "Add a file for every supporting document that is marked as ready.";
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
        "companyInfo.entityType",
        "companyInfo.registrationNumber",
        "companyInfo.taxId",
        "companyInfo.incorporationDate",
        "companyInfo.incorporationState",
        "companyInfo.incorporationCountry",
        "companyInfo.industry",
        "companyInfo.website",
        "companyInfo.annualRevenue",
        "companyInfo.employeeCount",
      ];
    case "contact":
      return [
        "primaryContact.fullName",
        "primaryContact.title",
        "primaryContact.email",
        "primaryContact.phone",
        "primaryContact.extension",
        "addresses.registeredLine1",
        "addresses.city",
        "addresses.state",
        "addresses.postalCode",
        "addresses.country",
        ...(workspace.addresses.operatingSameAsRegistered
          ? []
          : [
              "addresses.operatingLine1",
              "addresses.operatingCity",
              "addresses.operatingState",
              "addresses.operatingPostalCode",
              "addresses.operatingCountry",
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

function buildWorkspaceSubmissionSummary(workspace) {
  const legalName = String(workspace.companyInfo?.legalName ?? "").trim();
  const taxId = String(workspace.companyInfo?.taxId ?? "").trim();
  const entityLabel =
    legalName && taxId
      ? `${legalName} (${taxId})`
      : legalName || taxId || "Submitted application";
  const kycCheck = workspace.orchestration?.checks?.kyc ?? null;

  return {
    submissionId: workspace.submission?.referenceId ?? workspace.draftId ?? "current-submission",
    draftId: workspace.draftId ?? null,
    entityKey: "",
    entityLabel,
    legalName,
    taxId,
    submittedAt: workspace.submission?.submittedAt ?? workspace.lastUpdatedAt ?? null,
    overallDecision: workspace.submission?.overallDecision ?? "pending",
    kycStatus: kycCheck?.decision ?? kycCheck?.status ?? "pending",
    kycSummary: kycCheck?.summary ?? workspace.submission?.summary ?? "KYC review is pending.",
    recommendedAction:
      workspace.submission?.recommendedAction ??
      workspace.orchestration?.summary ??
      "",
    retrievalUrl: workspace.draftId ? `/?draft=${workspace.draftId}` : "",
  };
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

function shouldShowCheckKycMessage(checkKyc) {
  const message = String(checkKyc?.message ?? "").trim();

  return (
    Boolean(message) &&
    message !==
      "CheckKYC payload was prepared successfully. Configure CHECK_KYC_API_URL to forward it to an external application."
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
          <p>
            Response: <strong>{checkKyc.response ?? "Pending"}</strong>
          </p>
          {checkKyc.errorMessage ? <p>{checkKyc.errorMessage}</p> : null}
          {checkKyc.missingFields?.length ? (
            <div className="review-check-flags">
              {checkKyc.missingFields.map((field) => (
                <p key={field}>Missing field: {field}</p>
              ))}
            </div>
          ) : null}
          {shouldShowCheckKycMessage(checkKyc) ? <p>{checkKyc.message}</p> : null}
        </div>
      ) : null}
      {checkRisk ? (
        <div className="integration-callout">
          <p>
            checkRisk result: <strong>{checkRisk.risk ?? "Pending"}</strong>
          </p>
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
        {required ? <small aria-hidden="true">*</small> : null}
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
  const resolvedPlaceholder = placeholder ?? `Select ${label.toLowerCase()}`;

  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {required ? <small aria-hidden="true">*</small> : null}
      </span>
      <select
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        aria-invalid={Boolean(error)}
      >
        <option value="" disabled={required}>
          {resolvedPlaceholder}
        </option>
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
        {required ? <small aria-hidden="true">*</small> : null}
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

function DateField({
  label,
  value,
  onChange,
  required = false,
  onBlur,
  error = "",
}) {
  const inputRef = useRef(null);
  const inputId = useId();

  function openDatePicker() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  }

  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {required ? <small aria-hidden="true">*</small> : null}
      </span>
      <div className="date-field-control">
        <input
          ref={inputRef}
          id={inputId}
          type="date"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className="date-picker-button"
          onClick={openDatePicker}
          aria-label={`Open calendar for ${label}`}
          aria-controls={inputId}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="date-picker-icon"
            focusable="false"
          >
            <path
              d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM6 6a1 1 0 0 0-1 1v1h14V7a1 1 0 0 0-1-1H6Zm2 6h2v2H8v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Open calendar</span>
        </button>
      </div>
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

function DocumentUploadCard({
  title,
  detail,
  checked,
  file,
  error = "",
  onToggle,
  onFileSelect,
  onRemove,
}) {
  return (
    <div className={`document-card${checked ? " checked" : ""}`}>
      <OptionCard
        title={title}
        detail={detail}
        checked={checked}
        onChange={onToggle}
      />
      <div className="document-card-actions">
        <label className="secondary-button document-upload-button">
          <input type="file" hidden onChange={onFileSelect} />
          <span>{file ? "Replace document" : "Add document"}</span>
        </label>
        {file ? (
          <>
            <div className="document-file-pill">
              <strong>{file.name}</strong>
              <small>{formatFileSize(file.size)}</small>
            </div>
            <button
              type="button"
              className="ghost-button document-remove-button"
              onClick={onRemove}
            >
              Remove
            </button>
          </>
        ) : (
          <p className="document-card-copy">No file saved yet.</p>
        )}
      </div>
      {error ? <small className="field-error-copy">{error}</small> : null}
    </div>
  );
}

function OwnerCard({
  owner,
  index,
  titleOptions,
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
          autoComplete="name"
          required
        />
        <SelectField
          label="Title"
          value={owner.title}
          onChange={(event) => onFieldChange("title", event.target.value)}
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.title`)}
          error={getFieldError(`${ownerFieldPrefix}.title`)}
          options={titleOptions}
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
          autoComplete="email"
          required
        />
        <TextField
          label="Phone"
          value={owner.phone}
          onChange={(event) =>
            onFieldChange("phone", sanitizePhoneNumber(event.target.value))
          }
          onBlur={() => onFieldBlur(`${ownerFieldPrefix}.phone`)}
          error={getFieldError(`${ownerFieldPrefix}.phone`)}
          inputMode="numeric"
          maxLength={PHONE_DIGIT_LIMIT}
          autoComplete="tel"
          required
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

function App({ forceStandaloneShell = false } = {}) {
  const currentPathname =
    typeof window === "undefined" ? "/" : window.location.pathname;
  const isAdminExperience = isAdminRoute(currentPathname);
  const currentView = getCurrentView();
  const shouldResetOnRefresh =
    !isAdminExperience && currentView === "form" && isReloadNavigation();
  const embeddedApplicationRoute = isEmbeddedApplicationRoute(currentPathname);
  const kycFabricContext = embeddedApplicationRoute || forceStandaloneShell
    ? { isKycFabricExperience: false, routeLabel: "Application" }
    : getKycFabricContext(currentPathname);
  const requestedDraftId =
    shouldResetOnRefresh || isAdminExperience ? "" : getRequestedDraftId();
  const shouldLoadRequestedDraft = Boolean(requestedDraftId);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [workspace, setWorkspace] = useState(defaultWorkspace);
  const [drafts, setDrafts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [draftListState, setDraftListState] = useState("idle");
  const [submissionListState, setSubmissionListState] = useState("idle");
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
      setDraftListState("loading");
      setSubmissionListState("loading");
      setWorkspace({
        ...mergeWorkspace(defaultWorkspace),
        activeStep: defaultWorkspace.activeStep,
      });

      if (shouldResetOnRefresh) {
        resetToDefaultUrl(currentPathname);
      }

      try {
        const [draftResponse, submissionResponse, workspaceResponse] =
          await Promise.allSettled([
            listWorkspaceDrafts(),
            listSubmittedApplications(),
            shouldLoadRequestedDraft
              ? loadWorkspace(requestedDraftId)
              : Promise.resolve(null),
          ]);

        if (ignore) {
          return;
        }

        if (draftResponse.status === "fulfilled") {
          setDrafts(draftResponse.value.drafts ?? []);
          setDraftListState("loaded");
        } else {
          setDrafts([]);
          setDraftListState("error");
        }

        if (submissionResponse.status === "fulfilled") {
          setSubmissions(submissionResponse.value.submissions ?? []);
          setSubmissionListState("loaded");
        } else {
          setSubmissions([]);
          setSubmissionListState("error");
        }

        if (workspaceResponse.status === "fulfilled" && workspaceResponse.value) {
          const loadedWorkspace = workspaceResponse.value;

          setWorkspace(
            mergeWorkspace({
              ...loadedWorkspace,
              activeStep: defaultWorkspace.activeStep,
            }),
          );

          if (requestedDraftId) {
            syncDraftUrl(currentPathname, loadedWorkspace.draftId);
          }
        } else if (shouldLoadRequestedDraft) {
          throw workspaceResponse.reason;
        }

        setConnectionState(
          draftResponse.status === "fulfilled" ||
            submissionResponse.status === "fulfilled" ||
            (workspaceResponse.status === "fulfilled" && workspaceResponse.value)
            ? "connected"
            : "fallback",
        );
        setStatusMessage(
          requestedDraftId
            ? "Saved draft retrieved. You can continue editing the corporate account opening application."
            : currentView === "submitted"
              ? submissionResponse.status === "fulfilled"
                ? "Submitted applications loaded."
                : "Submitted applications are temporarily unavailable right now."
              : currentView === "drafts"
                ? "Saved drafts loaded. Select a draft to continue."
                : "Draft mode is ready. Start a new application at step 1 or select an existing draft.",
        );
        setHasBootstrapped(true);
      } catch (error) {
        if (ignore) {
          return;
        }

        setConnectionState("fallback");
        setDraftListState("error");
        setSubmissionListState("error");
        setStatusMessage(
          error?.payload?.code === "draft_not_found"
            ? "The requested draft link could not be found. A fresh application has been opened instead."
            : "The form is starting fresh while the application workspace is unreachable.",
        );
        setHasBootstrapped(true);
      }
    }

    bootstrapWorkspace();

    return () => {
      ignore = true;
    };
  }, [currentPathname, requestedDraftId, shouldLoadRequestedDraft, shouldResetOnRefresh]);

  const applicationBasePath = currentPathname.startsWith(KYC_FABRIC_PATH_PREFIX)
    ? KYC_FABRIC_APPLICATION_PATH
    : "/";
  const draftBrowserUrl = buildDraftBrowserPath(applicationBasePath);
  const submittedApplicationsUrl = buildSubmittedApplicationsPath(applicationBasePath);
  const customerAccountOpeningUrl = applicationBasePath;
  const adminConsoleUrl = ADMIN_PATH;
  const latestDraft = drafts[0] ?? null;
  const fallbackSubmission =
    workspace.submission?.status === "submitted"
      ? buildWorkspaceSubmissionSummary(workspace)
      : null;
  const visibleSubmissions =
    submissions.length > 0
      ? submissions
      : fallbackSubmission
        ? [fallbackSubmission]
        : [];
  const latestSubmission = visibleSubmissions[0] ?? null;
  const isDraftBrowserView = currentView === "drafts";
  const isSubmittedApplicationsView = currentView === "submitted";
  const shouldShowHeroMeta =
    !isAdminExperience && !isDraftBrowserView && !isSubmittedApplicationsView;
  const shouldShowAttachedSidebar = !isDraftBrowserView && !isSubmittedApplicationsView;
  const submittedReadyCount = visibleSubmissions.filter(
    (submission) => submission.overallDecision === "ready_for_bank_review",
  ).length;
  const submittedReviewCount = visibleSubmissions.filter(
    (submission) => submission.kycStatus === "review",
  ).length;

  const currentStep =
    workspace.steps.find((step) => step.id === workspace.activeStep) ??
    workspace.steps[0];
  const heroBrand = isAdminExperience
    ? "Operations Admin"
    : kycFabricContext.isKycFabricExperience
      ? workspace.brandName
      : workspace.brandName;
  const heroTitle = isAdminExperience
    ? "Database Control Room"
    : kycFabricContext.isKycFabricExperience
      ? `KYC Fabric ${kycFabricContext.routeLabel}`
      : workspace.formTitle;
  const heroIntro = isAdminExperience
    ? "Inspect live SQLite tables, review operational status, and execute controlled row inserts from one focused internal workspace."
    : kycFabricContext.isKycFabricExperience
      ? "A Cognizant-aligned operating surface for intake, due diligence, and onboarding decisions across every KYC checkpoint."
      : workspace.intro;
  const isReadOnly = workspace.submission.status === "submitted";
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
        isCompletedField("companyInfo.entityType", workspace.companyInfo.entityType),
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
        isCompletedField(
          "companyInfo.incorporationCountry",
          workspace.companyInfo.incorporationCountry,
        ),
        isCompletedField("companyInfo.industry", workspace.companyInfo.industry),
        isCompletedField("companyInfo.website", workspace.companyInfo.website),
        isCompletedField(
          "companyInfo.annualRevenue",
          workspace.companyInfo.annualRevenue,
        ),
        isCompletedField(
          "companyInfo.employeeCount",
          workspace.companyInfo.employeeCount,
        ),
      ].filter(Boolean).length,
      total: 11,
    },
    contact: {
      complete: [
        isCompletedField("primaryContact.fullName", workspace.primaryContact.fullName),
        isCompletedField("primaryContact.title", workspace.primaryContact.title),
        isCompletedField("primaryContact.email", workspace.primaryContact.email),
        isCompletedField("primaryContact.phone", workspace.primaryContact.phone),
        isCompletedField("addresses.registeredLine1", workspace.addresses.registeredLine1),
        isCompletedField("addresses.city", workspace.addresses.city),
        isCompletedField("addresses.state", workspace.addresses.state),
        isCompletedField("addresses.postalCode", workspace.addresses.postalCode),
        isCompletedField("addresses.country", workspace.addresses.country),
        ...(workspace.addresses.operatingSameAsRegistered
          ? []
          : [
              isCompletedField(
                "addresses.operatingLine1",
                workspace.addresses.operatingLine1,
              ),
              isCompletedField(
                "addresses.operatingCity",
                workspace.addresses.operatingCity,
              ),
              isCompletedField(
                "addresses.operatingState",
                workspace.addresses.operatingState,
              ),
              isCompletedField(
                "addresses.operatingPostalCode",
                workspace.addresses.operatingPostalCode,
              ),
              isCompletedField(
                "addresses.operatingCountry",
                workspace.addresses.operatingCountry,
              ),
            ]),
      ].filter(Boolean).length,
      total: workspace.addresses.operatingSameAsRegistered ? 9 : 14,
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
        isCompletedField(
          "bankingProfile.onlineBankingUsers",
          workspace.bankingProfile.onlineBankingUsers,
        ),
      ].filter(Boolean).length,
      total: 6,
    },
    ownership: {
      complete: [
        workspace.beneficialOwners.some(
          (owner) =>
            isFilled(owner.fullName) &&
            isFilled(owner.title) &&
            isFilled(owner.ownershipPercentage) &&
            isFilled(owner.email) &&
            isFilled(owner.phone) &&
            !validationErrors[`beneficialOwners.${owner.id}.fullName`] &&
            !validationErrors[`beneficialOwners.${owner.id}.title`] &&
            !validationErrors[`beneficialOwners.${owner.id}.ownershipPercentage`] &&
            !validationErrors[`beneficialOwners.${owner.id}.email`] &&
            !validationErrors[`beneficialOwners.${owner.id}.phone`],
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
  if (validationErrors["companyInfo.entityType"]) {
    missingItems.push("Select the legal entity type.");
  }
  if (validationErrors["companyInfo.incorporationState"]) {
    missingItems.push("Select the state of registration.");
  }
  if (validationErrors["companyInfo.incorporationCountry"]) {
    missingItems.push("Select the country of registration.");
  }
  if (validationErrors["companyInfo.website"]) {
    missingItems.push(validationErrors["companyInfo.website"]);
  }
  if (validationErrors["companyInfo.annualRevenue"]) {
    missingItems.push(validationErrors["companyInfo.annualRevenue"]);
  }
  if (validationErrors["companyInfo.employeeCount"]) {
    missingItems.push(validationErrors["companyInfo.employeeCount"]);
  }
  if (validationErrors["primaryContact.title"]) {
    missingItems.push("Provide the primary contact title.");
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
  if (validationErrors["addresses.country"]) {
    missingItems.push("Select the registered country.");
  }
  if (validationErrors["addresses.operatingCountry"]) {
    missingItems.push("Select the operating country.");
  }
  if (validationErrors["bankingProfile.accountPurpose"]) {
    missingItems.push("Describe the intended use of the account.");
  }
  if (validationErrors["bankingProfile.requestedProducts"]) {
    missingItems.push(validationErrors["bankingProfile.requestedProducts"]);
  }
  if (validationErrors["bankingProfile.onlineBankingUsers"]) {
    missingItems.push(validationErrors["bankingProfile.onlineBankingUsers"]);
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
  const ownerContractErrors = Object.entries(validationErrors)
    .filter(([fieldKey]) =>
      fieldKey.includes(".email") || fieldKey.includes(".phone"),
    )
    .map(([, message]) => message);
  missingItems.push(...ownerContractErrors);
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
    isReadOnly
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
      : isReadOnly
        ? "Submitted"
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

  async function refreshDraftList() {
    try {
      const draftResponse = await listWorkspaceDrafts();
      setDrafts(draftResponse.drafts ?? []);
      setDraftListState("loaded");
    } catch {
      setDraftListState("error");
    }
  }

  async function refreshSubmissionList() {
    try {
      const submissionResponse = await listSubmittedApplications();
      setSubmissions(submissionResponse.submissions ?? []);
      setSubmissionListState("loaded");
    } catch {
      setSubmissionListState("error");
    }
  }

  async function handleRetrieveDraft(draftId) {
    setStatusMessage("Retrieving the selected draft...");

    try {
      const loadedWorkspace = await loadWorkspace(draftId);
      const mergedWorkspace = mergeWorkspace({
        ...loadedWorkspace,
        activeStep: defaultWorkspace.activeStep,
      });

      setWorkspace(mergedWorkspace);
      setConnectionState("connected");
      setHasUnsavedChanges(false);
      setSaveState("saved");
      setSubmitState(
        mergedWorkspace.submission.status === "submitted" ? "submitted" : "idle",
      );
      syncDraftUrl(currentPathname, mergedWorkspace.draftId);
      setStatusMessage(
        "Selected draft retrieved. The application opened in draft mode at step 1.",
      );
    } catch (error) {
      setStatusMessage(
        error?.payload?.code === "draft_not_found"
          ? "That draft is no longer available."
          : "We couldn't retrieve the selected draft right now.",
      );
    }
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
      syncDraftUrl(currentPathname, mergedWorkspace.draftId);
      await refreshDraftList();

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
          ? "Draft saved to the secure database. Use the retrieval link to reopen it later."
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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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
    markFieldsTouched(["documents", `documents.${key}`]);
  }

  function handleStepChange(stepId) {
    startTransition(() => {
      setWorkspace((current) => ({
        ...current,
        activeStep: stepId,
      }));
    });
  }

  function toggleProduct(product) {
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

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

  async function handleDocumentFileSelect(key, file) {
    if (isReadOnly || !file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage("Document uploads must be 5 MB or smaller.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setWorkspace((current) => {
        const nextWorkspace = invalidateSubmission(current);

        return {
          ...nextWorkspace,
          documents: {
            ...current.documents,
            [key]: true,
          },
          documentFiles: {
            ...current.documentFiles,
            [key]: {
              name: file.name,
              type: file.type || "application/octet-stream",
              size: file.size,
              uploadedAt: new Date().toISOString(),
              dataUrl,
            },
          },
        };
      });
      markDirty();
      markFieldsTouched(["documents", `documents.${key}`]);
      setStatusMessage(`${file.name} was added to the draft and will be saved with it.`);
    } catch {
      setStatusMessage("We couldn't attach that document. Please try again.");
    }
  }

  function removeDocumentFile(key) {
    if (isReadOnly) {
      return;
    }

    setWorkspace((current) => {
      const nextWorkspace = invalidateSubmission(current);

      return {
        ...nextWorkspace,
        documents: {
          ...current.documents,
          [key]: false,
        },
        documentFiles: {
          ...current.documentFiles,
          [key]: null,
        },
      };
    });
    markDirty();
    markFieldsTouched(["documents", `documents.${key}`]);
    setStatusMessage("Document removed from the draft.");
  }

  function toggleDeclaration(key) {
    if (isReadOnly) {
      return;
    }

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
    if (isReadOnly) {
      return;
    }

    markFieldsTouched(currentStepFieldKeys);

    if (currentStepFieldKeys.some((fieldKey) => validationErrors[fieldKey])) {
      setStatusMessage("Please fix the highlighted fields before saving this section.");
      return;
    }

    await persistWorkspace("manual");
  }

  async function handleSubmitApplication() {
    if (isReadOnly) {
      return;
    }

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
      syncDraftUrl(currentPathname, mergedWorkspace.draftId);
      await refreshDraftList();
      await refreshSubmissionList();

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
      const errorMessage =
        error?.payload?.issues?.[0]?.message ??
        error?.message ??
        "We couldn't submit the application right now. Please review the form and try again.";

      if (error?.payload?.integration?.checkKyc) {
        setWorkspace((current) =>
          mergeFailedKycResult(current, error.payload, errorMessage),
        );
      }

      setStatusMessage(errorMessage);
    }
  }

  function handleContinue() {
    if (isReadOnly && currentStepIndex === workspace.steps.length - 1) {
      return;
    }

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
        <section className="form-card corporate-profile-card">
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
              autoComplete="organization"
              required
            />
            <TextField
              label="Trading / DBA name"
              value={workspace.companyInfo.tradingName}
              onChange={(event) =>
                updateSection("companyInfo", "tradingName", event.target.value)
              }
            />
            <SelectField
              label="Entity type"
              value={workspace.companyInfo.entityType}
              onChange={(event) =>
                updateSection("companyInfo", "entityType", event.target.value)
              }
              onBlur={() => handleFieldBlur("companyInfo.entityType")}
              error={getFieldError("companyInfo.entityType")}
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
              inputMode="numeric"
              maxLength={10}
              required
            />
            <DateField
              label="Date of incorporation"
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
              onBlur={() => handleFieldBlur("companyInfo.incorporationCountry")}
              error={getFieldError("companyInfo.incorporationCountry")}
              options={workspace.countryOptions}
              required
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
              type="url"
              autoComplete="url"
              required
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
              inputMode="numeric"
              maxLength={MONEY_DIGIT_LIMIT}
              required
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
              inputMode="numeric"
              maxLength={COUNT_DIGIT_LIMIT}
              required
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
              autoComplete="name"
              required
            />
            <SelectField
              label="Title"
              value={workspace.primaryContact.title}
              onChange={(event) =>
                updateSection("primaryContact", "title", event.target.value)
              }
              onBlur={() => handleFieldBlur("primaryContact.title")}
              error={getFieldError("primaryContact.title")}
              options={workspace.titleOptions}
              required
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
              autoComplete="address-line1"
              required
            />
            <TextField
              label="Address line 2"
              value={workspace.addresses.registeredLine2}
              onChange={(event) =>
                updateSection("addresses", "registeredLine2", event.target.value)
              }
            />
            <TextField
              label="City"
              value={workspace.addresses.city}
              onChange={(event) =>
                updateSection("addresses", "city", event.target.value)
              }
              onBlur={() => handleFieldBlur("addresses.city")}
              error={getFieldError("addresses.city")}
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
                onBlur={() => handleFieldBlur("addresses.country")}
                error={getFieldError("addresses.country")}
                options={workspace.countryOptions}
                required
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
                autoComplete="address-line1"
                required
              />
              <TextField
                label="Operating address line 2"
                value={workspace.addresses.operatingLine2}
                onChange={(event) =>
                  updateSection("addresses", "operatingLine2", event.target.value)
                }
              />
              <TextField
                label="Operating city"
                value={workspace.addresses.operatingCity}
                onChange={(event) =>
                  updateSection("addresses", "operatingCity", event.target.value)
                }
                onBlur={() => handleFieldBlur("addresses.operatingCity")}
                error={getFieldError("addresses.operatingCity")}
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
                onBlur={() => handleFieldBlur("addresses.operatingCountry")}
                error={getFieldError("addresses.operatingCountry")}
                options={workspace.countryOptions}
                required
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
              inputMode="numeric"
              maxLength={COUNT_DIGIT_LIMIT}
              required
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
                titleOptions={workspace.titleOptions}
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
              <DocumentUploadCard
                key={document.key}
                title={document.title}
                detail={document.detail}
                checked={workspace.documents[document.key]}
                file={workspace.documentFiles?.[document.key]}
                error={touchedFields.documents ? validationErrors[`documents.${document.key}`] ?? "" : ""}
                onToggle={() => toggleDocument(document.key)}
                onFileSelect={(event) =>
                  handleDocumentFileSelect(document.key, event.target.files?.[0])
                }
                onRemove={() => removeDocumentFile(document.key)}
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

  function renderDraftBrowser() {
    return (
      <section className="draft-browser">
        <div className="draft-browser-header">
          <p className="section-eyebrow">Draft library</p>
          <h2>Saved Corporate Account Opening drafts</h2>
          <p>
            Select a draft to retrieve the latest saved version into the application
            form.
          </p>
        </div>

        {draftListState === "loading" ? (
          <div className="draft-browser-empty">
            <p>Loading available drafts...</p>
          </div>
        ) : draftListState === "error" ? (
          <div className="draft-browser-empty">
            <p>Saved drafts are temporarily unavailable right now.</p>
          </div>
        ) : drafts.length ? (
          <div className="draft-browser-grid">
            {drafts.map((draft) => (
              <article key={draft.draftId} className="draft-browser-card">
                <p className="section-eyebrow">Latest saved version</p>
                <h3>{draft.entityLabel}</h3>
                <p>Last updated {formatTimestamp(draft.updatedAt)}</p>
                <div className="draft-browser-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleRetrieveDraft(draft.draftId)}
                  >
                    Retrieve draft
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="draft-browser-empty">
            <p>No saved drafts yet. Save a draft from the application form to see it here.</p>
          </div>
        )}
      </section>
    );
  }

  function renderSubmittedApplications() {
    return (
      <section className="submitted-browser">
        <div className="draft-browser-header">
          <p className="section-eyebrow">Submitted applications</p>
          <h2>Submitted customer onboarding cases</h2>
          <p>
            Review completed onboarding submissions, including the current KYC
            status and recommended next action.
          </p>
        </div>

        {submissionListState === "loading" && !visibleSubmissions.length ? (
          <div className="draft-browser-empty">
            <p>Loading submitted applications...</p>
          </div>
        ) : visibleSubmissions.length ? (
          <>
            {submissionListState === "error" ? (
              <div className="draft-browser-empty">
                <p>
                  Showing the currently submitted application while the full
                  submissions list is temporarily unavailable.
                </p>
              </div>
            ) : null}
            <div className="submitted-browser-grid">
              {visibleSubmissions.map((submission) => (
                <article
                  key={submission.submissionId}
                  className="submitted-application-card"
                >
                  <div className="submitted-application-header">
                    <div>
                      <p className="section-eyebrow">{submission.submissionId}</p>
                      <h3>{submission.entityLabel}</h3>
                    </div>
                    <p className="submitted-application-timestamp">
                      Submitted {formatTimestamp(submission.submittedAt)}
                    </p>
                  </div>

                  <div className="submitted-application-metrics">
                    <div className="submitted-application-metric">
                      <span>KYC status</span>
                      <strong>{formatDecision(submission.kycStatus)}</strong>
                    </div>
                    <div className="submitted-application-metric">
                      <span>Overall decision</span>
                      <strong>{formatDecision(submission.overallDecision)}</strong>
                    </div>
                  </div>
                  <p className="submitted-application-copy">
                    {submission.kycSummary}
                  </p>
                  <p className="submitted-application-copy subtle">
                    {submission.recommendedAction}
                  </p>

                  <div className="draft-browser-actions">
                    {submission.retrievalUrl ? (
                      <a className="secondary-button draft-action-button" href={submission.retrievalUrl}>
                        Open application
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : submissionListState === "error" ? (
          <div className="draft-browser-empty">
            <p>Submitted applications are temporarily unavailable right now.</p>
          </div>
        ) : (
          <div className="draft-browser-empty">
            <p>No submitted applications yet. Submit an onboarding application to see it here.</p>
          </div>
        )}
      </section>
    );
  }

  function renderApplicationSidebar() {
    return (
      <>
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
          <p className="section-eyebrow">Draft mode</p>
          <h3>Latest draft version</h3>
          {draftListState === "loading" ? (
            <p className="progress-copy">Loading latest draft...</p>
          ) : draftListState === "error" ? (
            <p className="progress-copy">
              Saved drafts are temporarily unavailable. You can still continue with the form.
            </p>
          ) : latestDraft ? (
            <div className={`draft-list-item${workspace.draftId === latestDraft.draftId ? " active" : ""}`}>
              <span>{latestDraft.entityLabel}</span>
              <strong>{formatTimestamp(latestDraft.updatedAt)}</strong>
              <div className="draft-list-actions">
                <button
                  type="button"
                  className="secondary-button draft-action-button"
                  onClick={() => handleRetrieveDraft(latestDraft.draftId)}
                >
                  Retrieve draft
                </button>
                <a className="draft-inline-link" href={draftBrowserUrl}>
                  Open link
                </a>
              </div>
            </div>
          ) : (
            <p className="progress-copy">
              No saved drafts yet. Start entering entity details and save a draft to see it here.
            </p>
          )}
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
      </>
    );
  }

  function renderSubmittedSidebar() {
    return (
      <>
        <div className="summary-card">
          <p className="section-eyebrow">Submitted queue</p>
          <h3>{visibleSubmissions.length} applications</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Ready for bank review</span>
              <strong>{submittedReadyCount}</strong>
            </div>
            <div className="summary-row">
              <span>KYC review flagged</span>
              <strong>{submittedReviewCount}</strong>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <p className="section-eyebrow">Latest submission</p>
          <h3>{latestSubmission?.entityLabel ?? "No submissions yet"}</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Submitted</span>
              <strong>{formatTimestamp(latestSubmission?.submittedAt)}</strong>
            </div>
            <div className="summary-row">
              <span>KYC status</span>
              <strong>{formatDecision(latestSubmission?.kycStatus)}</strong>
            </div>
            <div className="summary-row">
              <span>Decision</span>
              <strong>{formatDecision(latestSubmission?.overallDecision)}</strong>
            </div>
          </div>
          {latestSubmission?.recommendedAction ? (
            <p className="progress-copy">{latestSubmission.recommendedAction}</p>
          ) : null}
        </div>

        <div className="summary-card">
          <p className="section-eyebrow">Navigation</p>
          <h3>Customer onboarding</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Onboarding application</span>
              <strong>
                <a className="draft-inline-link" href={customerAccountOpeningUrl}>
                  Open form
                </a>
              </strong>
            </div>
            <div className="summary-row">
              <span>Draft applications</span>
              <strong>
                <a className="draft-inline-link" href={draftBrowserUrl}>
                  Open drafts
                </a>
              </strong>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderAdminWorkspace() {
    return (
      <section className="admin-workspace">
        <div className="admin-workspace-header">
          <div className="admin-kicker-row">
            <p className="section-eyebrow">Admin tools</p>
            <span className="admin-status-pill">{backendLabel}</span>
          </div>
          <h2>Database table agent</h2>
          <p>
            A single-purpose control surface for inspecting schema, collecting row
            values, and writing safely into the live workspace database.
          </p>
        </div>
        <div className="admin-signal-strip" aria-label="Admin workspace status">
          <div className="admin-signal-item">
            <span>Connection</span>
            <strong>{backendLabel}</strong>
          </div>
          <div className="admin-signal-item">
            <span>Draft records</span>
            <strong>{drafts.length}</strong>
          </div>
          <div className="admin-signal-item">
            <span>Submitted records</span>
            <strong>{visibleSubmissions.length}</strong>
          </div>
          <div className="admin-signal-item">
            <span>Last sync</span>
            <strong>{lastSyncedLabel}</strong>
          </div>
        </div>
        <TableInsertAssistant embedded />
      </section>
    );
  }

  function renderAdminSidebar() {
    return (
      <>
        <div className="summary-card">
          <p className="section-eyebrow">Operating mode</p>
          <h3>Controlled write access</h3>
          <div className="admin-side-list">
            <div className="admin-side-list-item">
              <span>Assistant flow</span>
              <strong>Step-by-step row capture</strong>
            </div>
            <div className="admin-side-list-item">
              <span>Scope</span>
              <strong>Live SQLite tables</strong>
            </div>
            <div className="admin-side-list-item">
              <span>Use case</span>
              <strong>Internal support operations</strong>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <p className="section-eyebrow">Operator notes</p>
          <h3>Before you insert</h3>
          <div className="admin-side-list">
            <div className="admin-side-list-item">
              <span>1</span>
              <strong>Pick the target table from the live list.</strong>
            </div>
            <div className="admin-side-list-item">
              <span>2</span>
              <strong>Validate each required field as the assistant prompts you.</strong>
            </div>
            <div className="admin-side-list-item">
              <span>3</span>
              <strong>Save only when the collected answers match the intended row.</strong>
            </div>
          </div>
        </div>
      </>
    );
  }

  const shellClassName = `application-shell${
    isAdminExperience
      ? " admin-shell"
      : kycFabricContext.isKycFabricExperience
        ? " kyc-fabric-shell"
        : " customer-account-shell"
  }`;

  return (
    <div
      className={shellClassName}
    >
      <header className="hero-panel">
        <div className="hero-copy">
          <p className="brand-mark">{heroBrand}</p>
          <h1>{heroTitle}</h1>
          <p>{heroIntro}</p>
        </div>
        {shouldShowHeroMeta ? (
          <div className="hero-meta">
            <SummaryChip label="Completion" value={`${completionPercentage}%`} tone="accent" />
            <SummaryChip label="Status" value={backendLabel} />
            <SummaryChip label="Submission" value={submissionLabel} />
            <SummaryChip label="Last sync" value={lastSyncedLabel} />
          </div>
        ) : null}
      </header>

      <div
        className={`workspace-layout${!isMenuExpanded ? " menu-collapsed" : ""}`}
      >
        <div className={`left-rail${!isMenuExpanded ? " collapsed" : ""}`}>
          <aside className="workspace-panel">
            <div className="workspace-panel-header">
              <p className="section-eyebrow">Menu</p>
              <button
                type="button"
                className="menu-toggle"
                aria-expanded={isMenuExpanded}
                aria-label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
                onClick={() => setIsMenuExpanded((currentValue) => !currentValue)}
              >
                <span className="menu-toggle-track">
                  <span className="menu-toggle-thumb" />
                </span>
              </button>
            </div>
            {isMenuExpanded ? (
              <nav className="workspace-switcher" aria-label="Workspace navigation">
                {isAdminExperience ? (
                  <div className="workspace-link workspace-link-group active">
                    <div className="workspace-group-header">
                      <span className="workspace-link-label">Admin</span>
                      <span className="workspace-link-detail">
                        Internal tools for database maintenance and operational support.
                      </span>
                    </div>
                    <div className="workspace-submenu">
                      <span className="workspace-submenu-label">Internal tools</span>
                      <a
                        className="workspace-sublink active"
                        href={adminConsoleUrl}
                      >
                        <span className="workspace-sublink-kicker">Manage</span>
                        <span className="workspace-sublink-label">Database table agent</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`workspace-link workspace-link-group${
                        !kycFabricContext.isKycFabricExperience ? " active" : ""
                      }`}
                    >
                      <div className="workspace-group-header">
                        <span className="workspace-link-label">Customer Onboarding</span>
                        <span className="workspace-link-detail">
                          Start a new onboarding request or reopen previously saved work.
                        </span>
                      </div>
                      <div className="workspace-submenu">
                        <span className="workspace-submenu-label">Choose a view</span>
                        <a
                          className={`workspace-sublink${
                            !kycFabricContext.isKycFabricExperience &&
                            !isDraftBrowserView &&
                            !isSubmittedApplicationsView
                              ? " active"
                              : ""
                          }`}
                          href={customerAccountOpeningUrl}
                        >
                          <span className="workspace-sublink-kicker">Start</span>
                          <span className="workspace-sublink-label">New application</span>
                        </a>
                        <a
                          className={`workspace-sublink${isSubmittedApplicationsView ? " active" : ""}`}
                          href={submittedApplicationsUrl}
                        >
                          <span className="workspace-sublink-kicker">Review</span>
                          <span className="workspace-sublink-label">Submitted applications</span>
                        </a>
                        <a
                          className={`workspace-sublink${isDraftBrowserView ? " active" : ""}`}
                          href={draftBrowserUrl}
                        >
                          <span className="workspace-sublink-kicker">Resume</span>
                          <span className="workspace-sublink-label">Saved drafts</span>
                        </a>
                      </div>
                    </div>
                    <div className="workspace-link workspace-link-group">
                      <div className="workspace-group-header">
                        <span className="workspace-link-label">Admin</span>
                        <span className="workspace-link-detail">
                          Internal tools for database maintenance and operational support.
                        </span>
                      </div>
                      <div className="workspace-submenu">
                        <span className="workspace-submenu-label">Internal tools</span>
                        <a
                          className="workspace-sublink"
                          href={adminConsoleUrl}
                        >
                          <span className="workspace-sublink-kicker">Manage</span>
                          <span className="workspace-sublink-label">Database table agent</span>
                        </a>
                      </div>
                    </div>
                    <a
                      className={`workspace-link${kycFabricContext.isKycFabricExperience ? " active" : ""}`}
                      href={KYC_FABRIC_URL}
                    >
                      <span className="workspace-link-label">KYC-Fabric</span>
                      <span className="workspace-link-detail">
                        Open the operating dashboard for case, risk, and governance views.
                      </span>
                    </a>
                  </>
                )}
              </nav>
            ) : null}
          </aside>
        </div>

        <main
          className={`form-stage${
            !isAdminExperience && workspace.activeStep === "company" ? " form-stage-light" : ""
          }`}
        >
          {isAdminExperience ? (
            renderAdminWorkspace()
          ) : isDraftBrowserView ? (
            renderDraftBrowser()
          ) : isSubmittedApplicationsView ? (
            renderSubmittedApplications()
          ) : (
            <>
          <section className="stage-banner">
            <div>
              <p className="section-eyebrow">
                Step {currentStepIndex + 1} of {workspace.steps.length}
              </p>
              <h2>{currentStep.title}</h2>
              <p>{currentStep.detail}</p>
              {isReadOnly ? (
                <p className="read-only-copy">
                  This application has been submitted and is now read only.
                </p>
              ) : null}
            </div>
            <div className="banner-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleSave}
                disabled={
                  isReadOnly || saveState === "saving" || submitState === "submitting"
                }
              >
                {saveLabel}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleContinue}
                disabled={
                  submitState === "submitting" ||
                  (isReadOnly && currentStepIndex === workspace.steps.length - 1)
                }
              >
                {currentStepIndex === workspace.steps.length - 1
                  ? submitLabel
                  : "Continue"}
              </button>
            </div>
          </section>

          <section className="status-banner" aria-live="polite">
            <p>{statusMessage}</p>
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

          <fieldset className="section-stack section-fieldset" disabled={isReadOnly}>
            {renderActiveSection()}
          </fieldset>

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
              disabled={
                submitState === "submitting" ||
                (isReadOnly && currentStepIndex === workspace.steps.length - 1)
              }
            >
              {currentStepIndex === workspace.steps.length - 1
                ? submitLabel
                : `Next: ${nextStep.label}`}
            </button>
          </section>
            </>
          )}
        </main>

        {shouldShowAttachedSidebar ? (
          <aside className={`summary-panel${isAdminExperience ? "" : " summary-panel-light"}`}>
            {isAdminExperience
              ? renderAdminSidebar()
              : isSubmittedApplicationsView
                ? renderSubmittedSidebar()
                : renderApplicationSidebar()}
          </aside>
        ) : null}
      </div>

      <footer className="support-footer">
        <div className="support-copy">
          <p className="section-eyebrow">Need help?</p>
          <h3>Talk to the onboarding support team</h3>
          <p>
            {isAdminExperience
              ? "Reach out if you need help with administrative tooling, database access, or operational controls."
              : kycFabricContext.isKycFabricExperience
              ? "Reach out for document issues, signer guidance, or review escalations across the KYC Fabric workspace."
              : "Reach out if you need help with documentation, business details, or authorized signer requirements."}
          </p>
        </div>
        <a className="support-link" href={`mailto:${workspace.supportEmail}`}>
          <span className="support-link-label">{workspace.supportEmail}</span>
          <span className="support-link-detail">Email support</span>
        </a>
      </footer>
    </div>
  );
}

export default App;
