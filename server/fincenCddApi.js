const OWNERSHIP_THRESHOLD_PCT = 25;

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeUbo(row) {
  return {
    ubo_id: row.ubo_id,
    entity_id: row.entity_id,
    first_name: row.first_name,
    last_name: row.last_name,
    date_of_birth: row.date_of_birth,
    residential_address_line1: row.residential_address_line1,
    residential_address_line2: row.residential_address_line2,
    residential_city: row.residential_city,
    residential_state: row.residential_state,
    residential_postal_code: row.residential_postal_code,
    residential_country: row.residential_country,
    nationality: row.nationality,
    country_of_residence: row.country_of_residence,
    id_type: row.id_type,
    id_number: row.id_number,
    id_expiry_date: row.id_expiry_date,
    id_issuing_country: row.id_issuing_country,
    ownership_pct: Number(row.ownership_pct),
    control_type: row.control_type,
    control_title: row.control_title,
    is_control_person: Boolean(row.is_control_person),
    cdd_verification_status: row.cdd_verification_status,
    cdd_verification_method: row.cdd_verification_method,
    cdd_verified_at: row.cdd_verified_at,
    cdd_certification_date: row.cdd_certification_date,
    cdd_certified_by: row.cdd_certified_by,
    screening_status: row.screening_status,
    last_screened_at: row.last_screened_at,
  };
}

function collectMissingUboFields(ubo) {
  const missing = [];

  [
    ["first_name", "First name"],
    ["last_name", "Last name"],
    ["date_of_birth", "Date of birth"],
    ["residential_address_line1", "Residential address line 1"],
    ["residential_city", "Residential city"],
    ["residential_country", "Residential country"],
    ["id_type", "Identification type"],
    ["id_number", "Identification number"],
    ["id_issuing_country", "Identification issuing country"],
  ].forEach(([key, label]) => {
    if (!hasText(ubo[key])) {
      missing.push(label);
    }
  });

  if (
    ubo.cdd_verification_status !== "VERIFIED" &&
    ubo.cdd_verification_status !== "EXEMPT"
  ) {
    missing.push("CDD identity verification status");
  }

  if (
    ubo.cdd_verification_status === "VERIFIED" &&
    !hasText(ubo.cdd_verification_method)
  ) {
    missing.push("CDD identity verification method");
  }

  if (ubo.is_control_person && !hasText(ubo.control_title)) {
    missing.push("Control person title");
  }

  return missing;
}

function makeSection(status, missing_items = [], extra = {}) {
  return {
    status,
    missing_items,
    ...extra,
  };
}

function statusForMissing(missingItems) {
  return missingItems.length > 0 ? "INCOMPLETE" : "COMPLETE";
}

function getEntity(db, entityId) {
  return db
    .prepare(
      `SELECT entity_id, legal_name, entity_type, jurisdiction, registration_no,
              tax_id, lei_code, incorporation_dt, is_listed, naics_code,
              risk_rating, status, created_at, updated_at
         FROM entity
        WHERE entity_id = ?`,
    )
    .get(entityId);
}

function getEntityUbos(db, entityId) {
  return db
    .prepare(
      `SELECT ubo_id, entity_id, first_name, last_name, date_of_birth,
              residential_address_line1, residential_address_line2,
              residential_city, residential_state, residential_postal_code,
              residential_country, nationality, country_of_residence, id_type,
              id_number, id_expiry_date, id_issuing_country, ownership_pct,
              control_type, control_title, is_control_person,
              cdd_verification_status, cdd_verification_method,
              cdd_verified_at, cdd_certification_date, cdd_certified_by,
              screening_status, last_screened_at
         FROM ubos
        WHERE entity_id = ?
        ORDER BY ownership_pct DESC, last_name ASC, first_name ASC`,
    )
    .all(entityId)
    .map(normalizeUbo);
}

export function buildFincenCddAssessment(db, entityId) {
  const normalizedEntityId = String(entityId ?? "").trim();

  if (!normalizedEntityId) {
    return {
      error: "entity_id is required.",
    };
  }

  const entity = getEntity(db, normalizedEntityId);

  if (!entity) {
    return {
      error: "Entity not found.",
      entityId: normalizedEntityId,
    };
  }

  const ubos = getEntityUbos(db, normalizedEntityId);
  const ownershipProngUbos = ubos.filter(
    (ubo) => ubo.ownership_pct >= OWNERSHIP_THRESHOLD_PCT,
  );
  const controlProngUbos = ubos.filter((ubo) => ubo.is_control_person);
  const coveredUbos = new Map();

  [...ownershipProngUbos, ...controlProngUbos].forEach((ubo) => {
    coveredUbos.set(ubo.ubo_id, ubo);
  });

  const customerIdentificationMissing = [];
  if (!hasText(entity.legal_name)) {
    customerIdentificationMissing.push("Legal entity name");
  }
  if (!hasText(entity.entity_type)) {
    customerIdentificationMissing.push("Legal entity type");
  }
  if (!hasText(entity.jurisdiction)) {
    customerIdentificationMissing.push("Jurisdiction");
  }
  if (!hasText(entity.registration_no) && !hasText(entity.tax_id)) {
    customerIdentificationMissing.push("Registration number or tax ID");
  }

  const beneficialOwnershipMissing = [];
  if (controlProngUbos.length === 0) {
    beneficialOwnershipMissing.push("At least one control-prong individual");
  }

  const uboFindings = Array.from(coveredUbos.values()).map((ubo) => ({
    ubo_id: ubo.ubo_id,
    name: `${ubo.first_name} ${ubo.last_name}`.trim(),
    ownership_pct: ubo.ownership_pct,
    prongs: [
      ubo.ownership_pct >= OWNERSHIP_THRESHOLD_PCT ? "OWNERSHIP" : null,
      ubo.is_control_person ? "CONTROL" : null,
    ].filter(Boolean),
    missing_items: collectMissingUboFields(ubo),
    verification_status: ubo.cdd_verification_status,
  }));

  uboFindings.forEach((finding) => {
    finding.missing_items.forEach((item) => {
      beneficialOwnershipMissing.push(`${finding.name || finding.ubo_id}: ${item}`);
    });
  });

  const riskProfileMissing = [];
  if (!hasText(entity.naics_code)) {
    riskProfileMissing.push("NAICS or industry classification");
  }
  if (!hasText(entity.risk_rating)) {
    riskProfileMissing.push("Customer risk rating");
  }

  const monitoringMissing = [];
  const screenedUbos = ubos.filter((ubo) => hasText(ubo.last_screened_at));
  const pendingScreeningUbos = ubos.filter(
    (ubo) => ubo.screening_status === "PENDING" || !hasText(ubo.screening_status),
  );
  if (ubos.length > 0 && screenedUbos.length === 0) {
    monitoringMissing.push("At least one completed UBO screening event");
  }
  if (pendingScreeningUbos.length > 0) {
    monitoringMissing.push("Resolve pending UBO screening statuses");
  }

  const allMissingItems = [
    ...customerIdentificationMissing,
    ...beneficialOwnershipMissing,
    ...riskProfileMissing,
    ...monitoringMissing,
  ];

  return {
    fincen_cdd_assessment: {
      rule: {
        name: "FinCEN Customer Due Diligence Requirements for Financial Institutions",
        ownership_threshold_pct: OWNERSHIP_THRESHOLD_PCT,
        requires_control_person: true,
        beneficial_owner_identity_fields: [
          "name",
          "date_of_birth",
          "residential_address",
          "identification_number",
        ],
      },
      entity: {
        entity_id: entity.entity_id,
        legal_name: entity.legal_name,
        entity_type: entity.entity_type,
        jurisdiction: entity.jurisdiction,
        registration_no: entity.registration_no,
        tax_id: entity.tax_id,
        naics_code: entity.naics_code,
        risk_rating: entity.risk_rating,
      },
      customer_identification: makeSection(
        statusForMissing(customerIdentificationMissing),
        customerIdentificationMissing,
      ),
      beneficial_ownership: makeSection(
        statusForMissing(beneficialOwnershipMissing),
        beneficialOwnershipMissing,
        {
          ownership_prong_ubos: ownershipProngUbos,
          control_prong_ubos: controlProngUbos,
          ubo_findings: uboFindings,
        },
      ),
      customer_risk_profile: makeSection(
        statusForMissing(riskProfileMissing),
        riskProfileMissing,
      ),
      ongoing_monitoring: makeSection(
        statusForMissing(monitoringMissing),
        monitoringMissing,
      ),
      cdd_ready: allMissingItems.length === 0,
      missing_items: allMissingItems,
    },
  };
}

export function buildFincenCddAssessmentFromPayload(db, payload) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      error: "Request body must be a JSON object.",
    };
  }

  return buildFincenCddAssessment(db, payload.entity_id);
}
