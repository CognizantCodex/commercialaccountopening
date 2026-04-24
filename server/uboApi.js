const ID_TYPES = new Set(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE"]);
const CONTROL_TYPES = new Set([
  "DIRECT_OWNERSHIP",
  "INDIRECT",
  "CONTROL_BY_OTHER_MEANS",
]);
const SCREENING_STATUSES = new Set(["PENDING", "CLEAR", "FLAGGED", "ESCALATED"]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "").trim());
}

function isIsoCountryCode(value) {
  return /^[A-Za-z]{2}$/.test(String(value ?? "").trim());
}

function parseBooleanFlag(value) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (value === 1 || value === "1" || value === "true") {
    return 1;
  }

  if (value === 0 || value === "0" || value === "false") {
    return 0;
  }

  return null;
}

function normalizeNullableText(value) {
  return hasText(value) ? String(value).trim() : null;
}

function normalizeUboRow(row) {
  if (!row) {
    return null;
  }

  return {
    ubo_id: row.ubo_id,
    entity_id: row.entity_id,
    first_name: row.first_name,
    last_name: row.last_name,
    date_of_birth: row.date_of_birth,
    nationality: row.nationality,
    country_of_residence: row.country_of_residence,
    id_type: row.id_type,
    id_number: row.id_number,
    id_expiry_date: row.id_expiry_date,
    id_issuing_country: row.id_issuing_country,
    ownership_pct: Number(row.ownership_pct),
    control_type: row.control_type,
    is_pep: Boolean(row.is_pep),
    is_sanctioned: Boolean(row.is_sanctioned),
    is_adverse_media: Boolean(row.is_adverse_media),
    screening_status: row.screening_status,
    last_screened_at: row.last_screened_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getUboRowById(db, uboId) {
  return db
    .prepare(
      `SELECT ubo_id, entity_id, first_name, last_name, date_of_birth, nationality,
              country_of_residence, id_type, id_number, id_expiry_date,
              id_issuing_country, ownership_pct, control_type, is_pep,
              is_sanctioned, is_adverse_media, screening_status, last_screened_at,
              created_at, updated_at
         FROM ubos
        WHERE ubo_id = ?`,
    )
    .get(uboId);
}

function entityExists(db, entityId) {
  return Boolean(
    db.prepare("SELECT entity_id FROM entity WHERE entity_id = ?").get(entityId),
  );
}

function collectUboValidationIssues(db, payload, { partial = false } = {}) {
  const issues = [];

  if (!isPlainObject(payload)) {
    return ["Request body must be a JSON object."];
  }

  if (!partial || Object.hasOwn(payload, "entity_id")) {
    if (!hasText(payload.entity_id)) {
      issues.push("entity_id is required.");
    } else if (!entityExists(db, String(payload.entity_id).trim())) {
      issues.push("entity_id does not reference an existing entity.");
    }
  }

  if (!partial || Object.hasOwn(payload, "first_name")) {
    if (!hasText(payload.first_name)) {
      issues.push("first_name is required.");
    }
  }

  if (!partial || Object.hasOwn(payload, "last_name")) {
    if (!hasText(payload.last_name)) {
      issues.push("last_name is required.");
    }
  }

  if (!partial || Object.hasOwn(payload, "date_of_birth")) {
    if (!hasText(payload.date_of_birth)) {
      issues.push("date_of_birth is required.");
    } else if (!isIsoDate(payload.date_of_birth)) {
      issues.push("date_of_birth must be in YYYY-MM-DD format.");
    }
  }

  if (!partial || Object.hasOwn(payload, "nationality")) {
    if (!hasText(payload.nationality)) {
      issues.push("nationality is required.");
    } else if (!isIsoCountryCode(payload.nationality)) {
      issues.push("nationality must be a 2-character ISO country code.");
    }
  }

  if (!partial || Object.hasOwn(payload, "country_of_residence")) {
    if (!hasText(payload.country_of_residence)) {
      issues.push("country_of_residence is required.");
    } else if (!isIsoCountryCode(payload.country_of_residence)) {
      issues.push("country_of_residence must be a 2-character ISO country code.");
    }
  }

  if (!partial || Object.hasOwn(payload, "id_type")) {
    const idType = String(payload.id_type ?? "").trim().toUpperCase();
    if (!idType) {
      issues.push("id_type is required.");
    } else if (!ID_TYPES.has(idType)) {
      issues.push("id_type must be one of PASSPORT, NATIONAL_ID, or DRIVERS_LICENSE.");
    }
  }

  if (!partial || Object.hasOwn(payload, "id_number")) {
    if (!hasText(payload.id_number)) {
      issues.push("id_number is required.");
    }
  }

  if (Object.hasOwn(payload, "id_expiry_date") && payload.id_expiry_date !== null) {
    if (!hasText(payload.id_expiry_date)) {
      issues.push("id_expiry_date must be null or in YYYY-MM-DD format.");
    } else if (!isIsoDate(payload.id_expiry_date)) {
      issues.push("id_expiry_date must be in YYYY-MM-DD format.");
    }
  }

  if (Object.hasOwn(payload, "id_issuing_country") && payload.id_issuing_country !== null) {
    if (!hasText(payload.id_issuing_country)) {
      issues.push("id_issuing_country must be null or a 2-character ISO country code.");
    } else if (!isIsoCountryCode(payload.id_issuing_country)) {
      issues.push("id_issuing_country must be a 2-character ISO country code.");
    }
  }

  if (!partial || Object.hasOwn(payload, "ownership_pct")) {
    const ownershipPct = Number(payload.ownership_pct);
    if (payload.ownership_pct === null || payload.ownership_pct === undefined || Number.isNaN(ownershipPct)) {
      issues.push("ownership_pct is required and must be a number.");
    } else if (ownershipPct < 0 || ownershipPct > 100) {
      issues.push("ownership_pct must be between 0 and 100.");
    }
  }

  if (Object.hasOwn(payload, "control_type") && payload.control_type !== null) {
    const controlType = String(payload.control_type ?? "").trim().toUpperCase();
    if (!controlType) {
      issues.push("control_type must be null or a supported value.");
    } else if (!CONTROL_TYPES.has(controlType)) {
      issues.push(
        "control_type must be one of DIRECT_OWNERSHIP, INDIRECT, or CONTROL_BY_OTHER_MEANS.",
      );
    }
  }

  if (Object.hasOwn(payload, "is_pep")) {
    if (parseBooleanFlag(payload.is_pep) === null) {
      issues.push("is_pep must be a boolean value.");
    }
  }

  if (Object.hasOwn(payload, "is_sanctioned")) {
    if (parseBooleanFlag(payload.is_sanctioned) === null) {
      issues.push("is_sanctioned must be a boolean value.");
    }
  }

  if (Object.hasOwn(payload, "is_adverse_media")) {
    if (parseBooleanFlag(payload.is_adverse_media) === null) {
      issues.push("is_adverse_media must be a boolean value.");
    }
  }

  if (Object.hasOwn(payload, "screening_status")) {
    const screeningStatus = String(payload.screening_status ?? "").trim().toUpperCase();
    if (!screeningStatus) {
      issues.push("screening_status must be a supported value.");
    } else if (!SCREENING_STATUSES.has(screeningStatus)) {
      issues.push("screening_status must be one of PENDING, CLEAR, FLAGGED, or ESCALATED.");
    }
  }

  if (Object.hasOwn(payload, "last_screened_at") && payload.last_screened_at !== null) {
    if (!hasText(payload.last_screened_at)) {
      issues.push("last_screened_at must be null or a timestamp string.");
    }
  }

  return issues;
}

export function listUbos(db, entityId = "") {
  const normalizedEntityId = String(entityId ?? "").trim();
  const rows = normalizedEntityId
    ? db
        .prepare(
          `SELECT ubo_id, entity_id, first_name, last_name, date_of_birth, nationality,
                  country_of_residence, id_type, id_number, id_expiry_date,
                  id_issuing_country, ownership_pct, control_type, is_pep,
                  is_sanctioned, is_adverse_media, screening_status, last_screened_at,
                  created_at, updated_at
             FROM ubos
            WHERE entity_id = ?
            ORDER BY created_at DESC, last_name ASC, first_name ASC`,
        )
        .all(normalizedEntityId)
    : db
        .prepare(
          `SELECT ubo_id, entity_id, first_name, last_name, date_of_birth, nationality,
                  country_of_residence, id_type, id_number, id_expiry_date,
                  id_issuing_country, ownership_pct, control_type, is_pep,
                  is_sanctioned, is_adverse_media, screening_status, last_screened_at,
                  created_at, updated_at
             FROM ubos
            ORDER BY created_at DESC, last_name ASC, first_name ASC`,
        )
        .all();

  return {
    ubos: rows.map(normalizeUboRow),
  };
}

export function getUboById(db, uboId) {
  const row = getUboRowById(db, uboId);

  if (!row) {
    return {
      error: "UBO not found.",
      uboId,
    };
  }

  return {
    ubo: normalizeUboRow(row),
  };
}

export function createUbo(db, payload) {
  const issues = collectUboValidationIssues(db, payload);

  if (issues.length > 0) {
    return {
      error: "UBO validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO ubos (
       entity_id, first_name, last_name, date_of_birth, nationality,
       country_of_residence, id_type, id_number, id_expiry_date,
       id_issuing_country, ownership_pct, control_type, is_pep,
       is_sanctioned, is_adverse_media, screening_status, last_screened_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    String(payload.entity_id).trim(),
    String(payload.first_name).trim(),
    String(payload.last_name).trim(),
    String(payload.date_of_birth).trim(),
    String(payload.nationality).trim().toUpperCase(),
    String(payload.country_of_residence).trim().toUpperCase(),
    String(payload.id_type).trim().toUpperCase(),
    String(payload.id_number).trim(),
    normalizeNullableText(payload.id_expiry_date),
    payload.id_issuing_country === null || payload.id_issuing_country === undefined
      ? null
      : String(payload.id_issuing_country).trim().toUpperCase(),
    Number(payload.ownership_pct),
    payload.control_type === null || payload.control_type === undefined
      ? null
      : String(payload.control_type).trim().toUpperCase(),
    parseBooleanFlag(payload.is_pep) ?? 0,
    parseBooleanFlag(payload.is_sanctioned) ?? 0,
    parseBooleanFlag(payload.is_adverse_media) ?? 0,
    hasText(payload.screening_status)
      ? String(payload.screening_status).trim().toUpperCase()
      : "PENDING",
    normalizeNullableText(payload.last_screened_at),
  );

  const row = db
    .prepare(
      `SELECT ubo_id, entity_id, first_name, last_name, date_of_birth, nationality,
              country_of_residence, id_type, id_number, id_expiry_date,
              id_issuing_country, ownership_pct, control_type, is_pep,
              is_sanctioned, is_adverse_media, screening_status, last_screened_at,
              created_at, updated_at
         FROM ubos
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    ubo: normalizeUboRow(row),
  };
}

export function updateUbo(db, uboId, payload) {
  const existing = db.prepare("SELECT ubo_id FROM ubos WHERE ubo_id = ?").get(uboId);

  if (!existing) {
    return {
      error: "UBO not found.",
      uboId,
    };
  }

  const issues = collectUboValidationIssues(db, payload, { partial: true });
  if (issues.length > 0) {
    return {
      error: "UBO validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "entity_id")) {
    updates.push("entity_id = ?");
    values.push(String(payload.entity_id).trim());
  }

  if (Object.hasOwn(payload, "first_name")) {
    updates.push("first_name = ?");
    values.push(String(payload.first_name).trim());
  }

  if (Object.hasOwn(payload, "last_name")) {
    updates.push("last_name = ?");
    values.push(String(payload.last_name).trim());
  }

  if (Object.hasOwn(payload, "date_of_birth")) {
    updates.push("date_of_birth = ?");
    values.push(String(payload.date_of_birth).trim());
  }

  if (Object.hasOwn(payload, "nationality")) {
    updates.push("nationality = ?");
    values.push(String(payload.nationality).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "country_of_residence")) {
    updates.push("country_of_residence = ?");
    values.push(String(payload.country_of_residence).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "id_type")) {
    updates.push("id_type = ?");
    values.push(String(payload.id_type).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "id_number")) {
    updates.push("id_number = ?");
    values.push(String(payload.id_number).trim());
  }

  if (Object.hasOwn(payload, "id_expiry_date")) {
    updates.push("id_expiry_date = ?");
    values.push(payload.id_expiry_date === null ? null : String(payload.id_expiry_date).trim());
  }

  if (Object.hasOwn(payload, "id_issuing_country")) {
    updates.push("id_issuing_country = ?");
    values.push(
      payload.id_issuing_country === null
        ? null
        : String(payload.id_issuing_country).trim().toUpperCase(),
    );
  }

  if (Object.hasOwn(payload, "ownership_pct")) {
    updates.push("ownership_pct = ?");
    values.push(Number(payload.ownership_pct));
  }

  if (Object.hasOwn(payload, "control_type")) {
    updates.push("control_type = ?");
    values.push(
      payload.control_type === null ? null : String(payload.control_type).trim().toUpperCase(),
    );
  }

  if (Object.hasOwn(payload, "is_pep")) {
    updates.push("is_pep = ?");
    values.push(parseBooleanFlag(payload.is_pep));
  }

  if (Object.hasOwn(payload, "is_sanctioned")) {
    updates.push("is_sanctioned = ?");
    values.push(parseBooleanFlag(payload.is_sanctioned));
  }

  if (Object.hasOwn(payload, "is_adverse_media")) {
    updates.push("is_adverse_media = ?");
    values.push(parseBooleanFlag(payload.is_adverse_media));
  }

  if (Object.hasOwn(payload, "screening_status")) {
    updates.push("screening_status = ?");
    values.push(String(payload.screening_status).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "last_screened_at")) {
    updates.push("last_screened_at = ?");
    values.push(payload.last_screened_at === null ? null : String(payload.last_screened_at).trim());
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    db.prepare(`UPDATE ubos SET ${updates.join(", ")} WHERE ubo_id = ?`).run(
      ...values,
      uboId,
    );
  }

  return getUboById(db, uboId);
}

export function deleteUbo(db, uboId) {
  const existing = getUboById(db, uboId);

  if (!existing.ubo) {
    return {
      error: "UBO not found.",
      uboId,
    };
  }

  db.prepare("DELETE FROM ubos WHERE ubo_id = ?").run(uboId);

  return {
    deleted: true,
    uboId,
    ubo: existing.ubo,
  };
}
