const DOC_TYPES = new Set(["ID_PROOF", "ADDRESS_PROOF", "OWNERSHIP_CERT"]);
const UPLOAD_STATUSES = new Set(["PENDING", "VERIFIED", "REJECTED"]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableText(value) {
  return hasText(value) ? String(value).trim() : null;
}

function normalizeUboDocumentRow(row) {
  if (!row) {
    return null;
  }

  return {
    doc_id: row.doc_id,
    ubo_id: row.ubo_id,
    doc_type: row.doc_type,
    file_ref: row.file_ref,
    file_hash: row.file_hash,
    upload_status: row.upload_status,
    verified_by: row.verified_by,
    verified_at: row.verified_at,
    expiry_date: row.expiry_date,
    created_at: row.created_at,
  };
}

function uboExists(db, uboId) {
  return Boolean(db.prepare("SELECT ubo_id FROM ubos WHERE ubo_id = ?").get(uboId));
}

function collectUboDocumentValidationIssues(db, payload, { partial = false } = {}) {
  const issues = [];

  if (!isPlainObject(payload)) {
    return ["Request body must be a JSON object."];
  }

  if (!partial || Object.hasOwn(payload, "ubo_id")) {
    if (!hasText(payload.ubo_id)) {
      issues.push("ubo_id is required.");
    } else if (!uboExists(db, String(payload.ubo_id).trim())) {
      issues.push("ubo_id does not reference an existing UBO.");
    }
  }

  if (!partial || Object.hasOwn(payload, "doc_type")) {
    const docType = String(payload.doc_type ?? "").trim().toUpperCase();
    if (!docType) {
      issues.push("doc_type is required.");
    } else if (!DOC_TYPES.has(docType)) {
      issues.push("doc_type must be one of ID_PROOF, ADDRESS_PROOF, or OWNERSHIP_CERT.");
    }
  }

  if (!partial || Object.hasOwn(payload, "file_ref")) {
    if (!hasText(payload.file_ref)) {
      issues.push("file_ref is required.");
    } else if (String(payload.file_ref).trim().length > 500) {
      issues.push("file_ref must be 500 characters or fewer.");
    }
  }

  if (Object.hasOwn(payload, "file_hash") && payload.file_hash !== null) {
    const fileHash = String(payload.file_hash ?? "").trim();
    if (!fileHash) {
      issues.push("file_hash must be null or a SHA-256 hash.");
    } else if (!/^[a-fA-F0-9]{64}$/.test(fileHash)) {
      issues.push("file_hash must be a 64-character hexadecimal SHA-256 hash.");
    }
  }

  if (Object.hasOwn(payload, "upload_status")) {
    const uploadStatus = String(payload.upload_status ?? "").trim().toUpperCase();
    if (!uploadStatus) {
      issues.push("upload_status must be a supported value.");
    } else if (!UPLOAD_STATUSES.has(uploadStatus)) {
      issues.push("upload_status must be one of PENDING, VERIFIED, or REJECTED.");
    }
  }

  if (Object.hasOwn(payload, "verified_by") && payload.verified_by !== null) {
    if (!hasText(payload.verified_by)) {
      issues.push("verified_by must be null or a user id.");
    }
  }

  if (Object.hasOwn(payload, "verified_at") && payload.verified_at !== null) {
    if (!hasText(payload.verified_at)) {
      issues.push("verified_at must be null or a timestamp string.");
    }
  }

  if (Object.hasOwn(payload, "expiry_date") && payload.expiry_date !== null) {
    const expiryDate = String(payload.expiry_date ?? "").trim();
    if (!expiryDate) {
      issues.push("expiry_date must be null or in YYYY-MM-DD format.");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      issues.push("expiry_date must be in YYYY-MM-DD format.");
    }
  }

  return issues;
}

function getUboDocumentRowById(db, docId) {
  return db
    .prepare(
      `SELECT doc_id, ubo_id, doc_type, file_ref, file_hash, upload_status,
              verified_by, verified_at, expiry_date, created_at
         FROM ubo_documents
        WHERE doc_id = ?`,
    )
    .get(docId);
}

export function listUboDocuments(db, filters = {}) {
  const conditions = [];
  const values = [];

  if (hasText(filters.ubo_id)) {
    conditions.push("ubo_id = ?");
    values.push(String(filters.ubo_id).trim());
  }

  if (hasText(filters.doc_type)) {
    conditions.push("doc_type = ?");
    values.push(String(filters.doc_type).trim().toUpperCase());
  }

  if (hasText(filters.upload_status)) {
    conditions.push("upload_status = ?");
    values.push(String(filters.upload_status).trim().toUpperCase());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT doc_id, ubo_id, doc_type, file_ref, file_hash, upload_status,
              verified_by, verified_at, expiry_date, created_at
         FROM ubo_documents
         ${whereClause}
        ORDER BY created_at DESC, doc_type ASC`,
    )
    .all(...values);

  return {
    ubo_documents: rows.map(normalizeUboDocumentRow),
  };
}

export function getUboDocumentById(db, docId) {
  const row = getUboDocumentRowById(db, docId);

  if (!row) {
    return {
      error: "UBO document not found.",
      docId,
    };
  }

  return {
    ubo_document: normalizeUboDocumentRow(row),
  };
}

export function createUboDocument(db, payload) {
  const issues = collectUboDocumentValidationIssues(db, payload);

  if (issues.length > 0) {
    return {
      error: "UBO document validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO ubo_documents (
       ubo_id, doc_type, file_ref, file_hash, upload_status,
       verified_by, verified_at, expiry_date
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    String(payload.ubo_id).trim(),
    String(payload.doc_type).trim().toUpperCase(),
    String(payload.file_ref).trim(),
    payload.file_hash === null || payload.file_hash === undefined
      ? null
      : String(payload.file_hash).trim().toLowerCase(),
    hasText(payload.upload_status)
      ? String(payload.upload_status).trim().toUpperCase()
      : "PENDING",
    normalizeNullableText(payload.verified_by),
    normalizeNullableText(payload.verified_at),
    normalizeNullableText(payload.expiry_date),
  );

  const row = db
    .prepare(
      `SELECT doc_id, ubo_id, doc_type, file_ref, file_hash, upload_status,
              verified_by, verified_at, expiry_date, created_at
         FROM ubo_documents
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    ubo_document: normalizeUboDocumentRow(row),
  };
}

export function updateUboDocument(db, docId, payload) {
  const existing = db
    .prepare("SELECT doc_id FROM ubo_documents WHERE doc_id = ?")
    .get(docId);

  if (!existing) {
    return {
      error: "UBO document not found.",
      docId,
    };
  }

  const issues = collectUboDocumentValidationIssues(db, payload, { partial: true });
  if (issues.length > 0) {
    return {
      error: "UBO document validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "ubo_id")) {
    updates.push("ubo_id = ?");
    values.push(String(payload.ubo_id).trim());
  }

  if (Object.hasOwn(payload, "doc_type")) {
    updates.push("doc_type = ?");
    values.push(String(payload.doc_type).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "file_ref")) {
    updates.push("file_ref = ?");
    values.push(String(payload.file_ref).trim());
  }

  if (Object.hasOwn(payload, "file_hash")) {
    updates.push("file_hash = ?");
    values.push(
      payload.file_hash === null ? null : String(payload.file_hash).trim().toLowerCase(),
    );
  }

  if (Object.hasOwn(payload, "upload_status")) {
    updates.push("upload_status = ?");
    values.push(String(payload.upload_status).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "verified_by")) {
    updates.push("verified_by = ?");
    values.push(payload.verified_by === null ? null : String(payload.verified_by).trim());
  }

  if (Object.hasOwn(payload, "verified_at")) {
    updates.push("verified_at = ?");
    values.push(payload.verified_at === null ? null : String(payload.verified_at).trim());
  }

  if (Object.hasOwn(payload, "expiry_date")) {
    updates.push("expiry_date = ?");
    values.push(payload.expiry_date === null ? null : String(payload.expiry_date).trim());
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE ubo_documents SET ${updates.join(", ")} WHERE doc_id = ?`).run(
      ...values,
      docId,
    );
  }

  return getUboDocumentById(db, docId);
}

export function deleteUboDocument(db, docId) {
  const existing = getUboDocumentById(db, docId);

  if (!existing.ubo_document) {
    return {
      error: "UBO document not found.",
      docId,
    };
  }

  db.prepare("DELETE FROM ubo_documents WHERE doc_id = ?").run(docId);

  return {
    deleted: true,
    docId,
    ubo_document: existing.ubo_document,
  };
}
