const AUDIT_ACTIONS = new Set([
  "CREATED",
  "UPDATED",
  "SCREENED",
  "APPROVED",
  "REJECTED",
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableText(value) {
  return hasText(value) ? String(value).trim() : null;
}

function normalizeChanges(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() ? value.trim() : null;
  }

  return JSON.stringify(value);
}

function parseChanges(value) {
  if (!hasText(value)) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeUboAuditLogRow(row) {
  if (!row) {
    return null;
  }

  return {
    log_id: row.log_id,
    entity_id: row.entity_id,
    ubo_id: row.ubo_id,
    action: row.action,
    performed_by: row.performed_by,
    ip_address: row.ip_address,
    changes: parseChanges(row.changes),
    created_at: row.created_at,
  };
}

function entityExists(db, entityId) {
  return Boolean(db.prepare("SELECT entity_id FROM entity WHERE entity_id = ?").get(entityId));
}

function uboExists(db, uboId) {
  return Boolean(db.prepare("SELECT ubo_id FROM ubos WHERE ubo_id = ?").get(uboId));
}

function isValidJsonString(value) {
  if (!hasText(value)) {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function isValidIpAddress(value) {
  if (!hasText(value)) {
    return false;
  }

  const normalized = String(value).trim();
  return normalized.includes(".") || normalized.includes(":");
}

function collectUboAuditLogValidationIssues(db, payload, { partial = false } = {}) {
  const issues = [];

  if (!isPlainObject(payload)) {
    return ["Request body must be a JSON object."];
  }

  if (Object.hasOwn(payload, "entity_id") && payload.entity_id !== null) {
    if (!hasText(payload.entity_id)) {
      issues.push("entity_id must be null or an existing entity id.");
    } else if (!entityExists(db, String(payload.entity_id).trim())) {
      issues.push("entity_id does not reference an existing entity.");
    }
  }

  if (Object.hasOwn(payload, "ubo_id") && payload.ubo_id !== null) {
    if (!hasText(payload.ubo_id)) {
      issues.push("ubo_id must be null or an existing UBO id.");
    } else if (!uboExists(db, String(payload.ubo_id).trim())) {
      issues.push("ubo_id does not reference an existing UBO.");
    }
  }

  if (!partial || Object.hasOwn(payload, "action")) {
    const action = String(payload.action ?? "").trim().toUpperCase();
    if (!action) {
      issues.push("action is required.");
    } else if (!AUDIT_ACTIONS.has(action)) {
      issues.push("action must be one of CREATED, UPDATED, SCREENED, APPROVED, or REJECTED.");
    }
  }

  if (!partial || Object.hasOwn(payload, "performed_by")) {
    if (!hasText(payload.performed_by)) {
      issues.push("performed_by is required.");
    }
  }

  if (Object.hasOwn(payload, "ip_address") && payload.ip_address !== null) {
    if (!isValidIpAddress(payload.ip_address)) {
      issues.push("ip_address must be null or a valid IP address string.");
    }
  }

  if (Object.hasOwn(payload, "changes")) {
    const changes = normalizeChanges(payload.changes);
    if (changes !== null && !isValidJsonString(changes)) {
      issues.push("changes must be null, a JSON object, or valid JSON text.");
    }
  }

  return issues;
}

function getUboAuditLogRowById(db, logId) {
  return db
    .prepare(
      `SELECT log_id, entity_id, ubo_id, action, performed_by,
              ip_address, changes, created_at
         FROM ubo_audit_log
        WHERE log_id = ?`,
    )
    .get(logId);
}

export function listUboAuditLogs(db, filters = {}) {
  const conditions = [];
  const values = [];

  if (hasText(filters.entity_id)) {
    conditions.push("entity_id = ?");
    values.push(String(filters.entity_id).trim());
  }

  if (hasText(filters.ubo_id)) {
    conditions.push("ubo_id = ?");
    values.push(String(filters.ubo_id).trim());
  }

  if (hasText(filters.action)) {
    conditions.push("action = ?");
    values.push(String(filters.action).trim().toUpperCase());
  }

  if (hasText(filters.performed_by)) {
    conditions.push("performed_by = ?");
    values.push(String(filters.performed_by).trim());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT log_id, entity_id, ubo_id, action, performed_by,
              ip_address, changes, created_at
         FROM ubo_audit_log
         ${whereClause}
        ORDER BY created_at DESC, action ASC`,
    )
    .all(...values);

  return {
    ubo_audit_logs: rows.map(normalizeUboAuditLogRow),
  };
}

export function getUboAuditLogById(db, logId) {
  const row = getUboAuditLogRowById(db, logId);

  if (!row) {
    return {
      error: "UBO audit log not found.",
      logId,
    };
  }

  return {
    ubo_audit_log: normalizeUboAuditLogRow(row),
  };
}

export function createUboAuditLog(db, payload) {
  const issues = collectUboAuditLogValidationIssues(db, payload);

  if (issues.length > 0) {
    return {
      error: "UBO audit log validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO ubo_audit_log (
       entity_id, ubo_id, action, performed_by, ip_address, changes
     ) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    normalizeNullableText(payload.entity_id),
    normalizeNullableText(payload.ubo_id),
    String(payload.action).trim().toUpperCase(),
    String(payload.performed_by).trim(),
    normalizeNullableText(payload.ip_address),
    normalizeChanges(payload.changes),
  );

  const row = db
    .prepare(
      `SELECT log_id, entity_id, ubo_id, action, performed_by,
              ip_address, changes, created_at
         FROM ubo_audit_log
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    ubo_audit_log: normalizeUboAuditLogRow(row),
  };
}

export function updateUboAuditLog(db, logId, payload) {
  const existing = db
    .prepare("SELECT log_id FROM ubo_audit_log WHERE log_id = ?")
    .get(logId);

  if (!existing) {
    return {
      error: "UBO audit log not found.",
      logId,
    };
  }

  const issues = collectUboAuditLogValidationIssues(db, payload, { partial: true });
  if (issues.length > 0) {
    return {
      error: "UBO audit log validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "entity_id")) {
    updates.push("entity_id = ?");
    values.push(normalizeNullableText(payload.entity_id));
  }

  if (Object.hasOwn(payload, "ubo_id")) {
    updates.push("ubo_id = ?");
    values.push(normalizeNullableText(payload.ubo_id));
  }

  if (Object.hasOwn(payload, "action")) {
    updates.push("action = ?");
    values.push(String(payload.action).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "performed_by")) {
    updates.push("performed_by = ?");
    values.push(String(payload.performed_by).trim());
  }

  if (Object.hasOwn(payload, "ip_address")) {
    updates.push("ip_address = ?");
    values.push(normalizeNullableText(payload.ip_address));
  }

  if (Object.hasOwn(payload, "changes")) {
    updates.push("changes = ?");
    values.push(normalizeChanges(payload.changes));
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE ubo_audit_log SET ${updates.join(", ")} WHERE log_id = ?`).run(
      ...values,
      logId,
    );
  }

  return getUboAuditLogById(db, logId);
}

export function deleteUboAuditLog(db, logId) {
  const existing = getUboAuditLogById(db, logId);

  if (!existing.ubo_audit_log) {
    return {
      error: "UBO audit log not found.",
      logId,
    };
  }

  db.prepare("DELETE FROM ubo_audit_log WHERE log_id = ?").run(logId);

  return {
    deleted: true,
    logId,
    ubo_audit_log: existing.ubo_audit_log,
  };
}
