function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEntityRow(row) {
  if (!row) {
    return null;
  }

  return {
    entity_id: row.entity_id,
    legal_name: row.legal_name,
    entity_type: row.entity_type,
    jurisdiction: row.jurisdiction,
    registration_no: row.registration_no,
    tax_id: row.tax_id,
    lei_code: row.lei_code,
    incorporation_dt: row.incorporation_dt,
    is_listed: Boolean(row.is_listed),
    naics_code: row.naics_code,
    risk_rating: row.risk_rating,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function collectEntityValidationIssues(payload, { partial = false } = {}) {
  const issues = [];

  if (!partial || Object.hasOwn(payload, "legal_name")) {
    if (!hasText(payload.legal_name)) {
      issues.push("legal_name is required.");
    }
  }

  if (!partial || Object.hasOwn(payload, "entity_type")) {
    if (!hasText(payload.entity_type)) {
      issues.push("entity_type is required.");
    }
  }

  if (!partial || Object.hasOwn(payload, "jurisdiction")) {
    const jurisdiction = String(payload.jurisdiction ?? "").trim();
    if (!jurisdiction) {
      issues.push("jurisdiction is required.");
    } else if (jurisdiction.length !== 2) {
      issues.push("jurisdiction must be a 2-character ISO country code.");
    }
  }

  return issues;
}

export function listEntities(db) {
  const rows = db
    .prepare(
      `SELECT entity_id, legal_name, entity_type, jurisdiction, registration_no,
              tax_id, lei_code, incorporation_dt, is_listed, naics_code,
              risk_rating, status, created_at, updated_at
         FROM entity
        ORDER BY created_at DESC, legal_name ASC`,
    )
    .all();

  return {
    entities: rows.map(normalizeEntityRow),
  };
}

export function getEntityById(db, entityId) {
  const row = db
    .prepare(
      `SELECT entity_id, legal_name, entity_type, jurisdiction, registration_no,
              tax_id, lei_code, incorporation_dt, is_listed, naics_code,
              risk_rating, status, created_at, updated_at
         FROM entity
        WHERE entity_id = ?`,
    )
    .get(entityId);

  if (!row) {
    return {
      error: "Entity not found.",
      entityId,
    };
  }

  return {
    entity: normalizeEntityRow(row),
  };
}

export function createEntity(db, payload) {
  const issues = collectEntityValidationIssues(payload);

  if (issues.length > 0) {
    return {
      error: "Entity validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO entity (
       legal_name, entity_type, jurisdiction, registration_no, tax_id, lei_code,
       incorporation_dt, is_listed, naics_code, risk_rating, status
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    String(payload.legal_name).trim(),
    String(payload.entity_type).trim(),
    String(payload.jurisdiction).trim().toUpperCase(),
    hasText(payload.registration_no) ? String(payload.registration_no).trim() : null,
    hasText(payload.tax_id) ? String(payload.tax_id).trim() : null,
    hasText(payload.lei_code) ? String(payload.lei_code).trim() : null,
    hasText(payload.incorporation_dt) ? String(payload.incorporation_dt).trim() : null,
    payload.is_listed ? 1 : 0,
    hasText(payload.naics_code) ? String(payload.naics_code).trim() : null,
    hasText(payload.risk_rating) ? String(payload.risk_rating).trim().toUpperCase() : null,
    hasText(payload.status) ? String(payload.status).trim().toUpperCase() : "PENDING",
  );

  const row = db
    .prepare(
      `SELECT entity_id, legal_name, entity_type, jurisdiction, registration_no,
              tax_id, lei_code, incorporation_dt, is_listed, naics_code,
              risk_rating, status, created_at, updated_at
         FROM entity
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    entity: normalizeEntityRow(row),
  };
}

export function updateEntity(db, entityId, payload) {
  const existing = db
    .prepare("SELECT entity_id FROM entity WHERE entity_id = ?")
    .get(entityId);

  if (!existing) {
    return {
      error: "Entity not found.",
      entityId,
    };
  }

  const issues = collectEntityValidationIssues(payload, { partial: true });
  if (issues.length > 0) {
    return {
      error: "Entity validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "legal_name")) {
    updates.push("legal_name = ?");
    values.push(hasText(payload.legal_name) ? String(payload.legal_name).trim() : null);
  }

  if (Object.hasOwn(payload, "entity_type")) {
    updates.push("entity_type = ?");
    values.push(hasText(payload.entity_type) ? String(payload.entity_type).trim() : null);
  }

  if (Object.hasOwn(payload, "jurisdiction")) {
    updates.push("jurisdiction = ?");
    values.push(hasText(payload.jurisdiction) ? String(payload.jurisdiction).trim().toUpperCase() : null);
  }

  if (Object.hasOwn(payload, "registration_no")) {
    updates.push("registration_no = ?");
    values.push(hasText(payload.registration_no) ? String(payload.registration_no).trim() : null);
  }

  if (Object.hasOwn(payload, "tax_id")) {
    updates.push("tax_id = ?");
    values.push(hasText(payload.tax_id) ? String(payload.tax_id).trim() : null);
  }

  if (Object.hasOwn(payload, "lei_code")) {
    updates.push("lei_code = ?");
    values.push(hasText(payload.lei_code) ? String(payload.lei_code).trim() : null);
  }

  if (Object.hasOwn(payload, "incorporation_dt")) {
    updates.push("incorporation_dt = ?");
    values.push(hasText(payload.incorporation_dt) ? String(payload.incorporation_dt).trim() : null);
  }

  if (Object.hasOwn(payload, "is_listed")) {
    updates.push("is_listed = ?");
    values.push(payload.is_listed ? 1 : 0);
  }

  if (Object.hasOwn(payload, "naics_code")) {
    updates.push("naics_code = ?");
    values.push(hasText(payload.naics_code) ? String(payload.naics_code).trim() : null);
  }

  if (Object.hasOwn(payload, "risk_rating")) {
    updates.push("risk_rating = ?");
    values.push(hasText(payload.risk_rating) ? String(payload.risk_rating).trim().toUpperCase() : null);
  }

  if (Object.hasOwn(payload, "status")) {
    updates.push("status = ?");
    values.push(hasText(payload.status) ? String(payload.status).trim().toUpperCase() : null);
  }

  if (updates.length > 0) {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    db.prepare(`UPDATE entity SET ${updates.join(", ")} WHERE entity_id = ?`).run(
      ...values,
      entityId,
    );
  }

  return getEntityById(db, entityId);
}

export function deleteEntity(db, entityId) {
  const existing = getEntityById(db, entityId);

  if (!existing.entity) {
    return {
      error: "Entity not found.",
      entityId,
    };
  }

  db.prepare("DELETE FROM entity WHERE entity_id = ?").run(entityId);

  return {
    deleted: true,
    entityId,
    entity: existing.entity,
  };
}
