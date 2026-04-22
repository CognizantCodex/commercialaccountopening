function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeFreeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIdentifier(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function collectMissingFields(payload) {
  const missingFields = [];

  if (!hasText(payload?.entityName)) {
    missingFields.push("entityName");
  }

  if (!hasText(payload?.address)) {
    missingFields.push("address");
  }

  if (!hasText(payload?.taxId)) {
    missingFields.push("taxId");
  }

  return missingFields;
}

export async function processCheckKybRequest(db, payload) {
  const checkedAt = new Date().toISOString();
  const missingFields = collectMissingFields(payload);

  if (missingFields.length > 0) {
    return {
      status: "Fail",
      message: `CheckKYB request is missing required fields: ${missingFields.join(", ")}.`,
      entityName: payload?.entityName ?? null,
      addressMatched: false,
      taxIdMatched: false,
      companyStatus: null,
      checkedAt,
      missingFields,
    };
  }

  const row = db
    .prepare(
      `SELECT business_name, control_number, principal_business_address, status
       FROM business_information
       WHERE lower(business_name) = lower(?)`,
    )
    .get(String(payload.entityName).trim());

  if (!row) {
    return {
      status: "Fail",
      message: "KYB failed because no business record was found for the supplied entity name.",
      entityName: String(payload.entityName).trim(),
      addressMatched: false,
      taxIdMatched: false,
      companyStatus: null,
      checkedAt,
      missingFields: [],
    };
  }

  const addressMatched =
    normalizeFreeText(payload.address) ===
    normalizeFreeText(row.principal_business_address);
  const taxIdMatched =
    normalizeIdentifier(payload.taxId) === normalizeIdentifier(row.control_number);
  const companyActive = String(row.status).toLowerCase() === "active";
  const passed = addressMatched && taxIdMatched && companyActive;

  let message = "KYB failed because the supplied address or tax ID did not match the business record.";
  if (passed) {
    message =
      "KYB passed because address and tax ID matched and the company status is active.";
  } else if (addressMatched && taxIdMatched && !companyActive) {
    message = "KYB failed because the company status is not active.";
  }

  return {
    status: passed ? "Pass" : "Fail",
    message,
    entityName: row.business_name,
    addressMatched,
    taxIdMatched,
    companyStatus: row.status,
    checkedAt,
    missingFields: [],
  };
}
