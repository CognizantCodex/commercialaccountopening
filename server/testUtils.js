import { defaultWorkspace } from "../src/defaultWorkspace.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createValidWorkspace(overrides = {}) {
  const workspace = clone(defaultWorkspace);

  workspace.companyInfo = {
    ...workspace.companyInfo,
    legalName: "Northwind Treasury LLC",
    tradingName: "Northwind Treasury",
    entityType: "Limited Liability Company",
    registrationNumber: "NW-100200",
    taxId: "12-3456789",
    incorporationDate: "2024-01-12",
    incorporationState: "New York",
    incorporationCountry: "United States",
    industry: "Technology services",
    website: "northwind.example.com",
    annualRevenue: "2500000",
    employeeCount: "25",
  };

  workspace.primaryContact = {
    ...workspace.primaryContact,
    fullName: "Alex Morgan",
    title: "Treasury Manager",
    email: "alex.morgan@northwind.example.com",
    phone: "(212) 555-0199",
    extension: "456",
  };

  workspace.addresses = {
    ...workspace.addresses,
    registeredLine1: "100 Market Street",
    registeredLine2: "Suite 900",
    city: "New York",
    state: "New York",
    postalCode: "10001",
    country: "United States",
    operatingSameAsRegistered: true,
    operatingLine1: "",
    operatingLine2: "",
    operatingCity: "",
    operatingState: "",
    operatingPostalCode: "",
    operatingCountry: "",
  };

  workspace.bankingProfile = {
    ...workspace.bankingProfile,
    accountPurpose: "Operating account for vendor payments and collections",
    requestedProducts: ["Operating account", "ACH origination"],
    expectedOpeningDeposit: "100000",
    monthlyIncoming: "750000",
    monthlyOutgoing: "500000",
    onlineBankingUsers: "4",
    internationalActivity: false,
    jurisdictionsInScope: "",
    needsCommercialCards: true,
  };

  workspace.beneficialOwners = [
    {
      id: "owner-1",
      fullName: "Jordan Lee",
      title: "Managing Member",
      ownershipPercentage: "65",
      email: "jordan.lee@northwind.example.com",
      phone: "(646) 555-0123",
      isAuthorizedSigner: true,
    },
  ];

  workspace.documents = {
    ...workspace.documents,
    certificateOfFormation: true,
    taxIdLetter: true,
    ownershipChart: true,
    boardResolution: true,
    signerIdentification: false,
    addressProof: false,
  };

  workspace.declarations = {
    ...workspace.declarations,
    certifyAuthority: true,
    certifyBeneficialOwners: true,
    confirmTaxCompliance: true,
    confirmTerms: true,
  };

  workspace.additionalNotes = "Priority onboarding request for treasury rollout.";

  return mergeWorkspace(workspace, overrides);
}

function mergeWorkspace(baseValue, overrideValue) {
  if (Array.isArray(overrideValue)) {
    return clone(overrideValue);
  }

  if (
    overrideValue &&
    typeof overrideValue === "object" &&
    !Array.isArray(overrideValue)
  ) {
    const nextValue = { ...baseValue };

    Object.entries(overrideValue).forEach(([key, value]) => {
      nextValue[key] = mergeWorkspace(baseValue?.[key], value);
    });

    return nextValue;
  }

  return overrideValue === undefined ? baseValue : overrideValue;
}
