const SCREENING_TYPES = new Set(["SANCTIONS", "PEP", "ADVERSE_MEDIA", "WATCHLIST"]);
const RESULT_STATUSES = new Set([
  "CLEAR",
  "HIT",
  "POTENTIAL_MATCH",
  "FALSE_POSITIVE",
]);
const DISPOSITIONS = new Set(["CONFIRMED_MATCH", "CLEARED", "ESCALATED"]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableText(value) {
  return hasText(value) ? String(value).trim() : null;
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
}

function normalizeRawResponse(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() ? value.trim() : null;
  }

  return JSON.stringify(value);
}

function parseRawResponse(value) {
  if (!hasText(value)) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeUboScreeningResultRow(row) {
  if (!row) {
    return null;
  }

  return {
    result_id: row.result_id,
    ubo_id: row.ubo_id,
    screening_type: row.screening_type,
    provider: row.provider,
    result_status: row.result_status,
    match_score:
      row.match_score === null || row.match_score === undefined
        ? null
        : Number(row.match_score),
    raw_response: parseRawResponse(row.raw_response),
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    disposition: row.disposition,
    created_at: row.created_at,
  };
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

function collectUboScreeningResultValidationIssues(db, payload, { partial = false } = {}) {
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

  if (!partial || Object.hasOwn(payload, "screening_type")) {
    const screeningType = String(payload.screening_type ?? "").trim().toUpperCase();
    if (!screeningType) {
      issues.push("screening_type is required.");
    } else if (!SCREENING_TYPES.has(screeningType)) {
      issues.push(
        "screening_type must be one of SANCTIONS, PEP, ADVERSE_MEDIA, or WATCHLIST.",
      );
    }
  }

  if (Object.hasOwn(payload, "provider") && payload.provider !== null) {
    const provider = String(payload.provider ?? "").trim();
    if (!provider) {
      issues.push("provider must be null or a provider name.");
    } else if (provider.length > 50) {
      issues.push("provider must be 50 characters or fewer.");
    }
  }

  if (!partial || Object.hasOwn(payload, "result_status")) {
    const resultStatus = String(payload.result_status ?? "").trim().toUpperCase();
    if (!resultStatus) {
      issues.push("result_status is required.");
    } else if (!RESULT_STATUSES.has(resultStatus)) {
      issues.push(
        "result_status must be one of CLEAR, HIT, POTENTIAL_MATCH, or FALSE_POSITIVE.",
      );
    }
  }

  if (Object.hasOwn(payload, "match_score")) {
    const matchScore = normalizeNullableNumber(payload.match_score);
    if (matchScore !== null && Number.isNaN(matchScore)) {
      issues.push("match_score must be null or a number.");
    } else if (matchScore !== null && (matchScore < 0 || matchScore > 100)) {
      issues.push("match_score must be between 0 and 100.");
    }
  }

  if (Object.hasOwn(payload, "raw_response")) {
    const rawResponse = normalizeRawResponse(payload.raw_response);
    if (rawResponse !== null && !isValidJsonString(rawResponse)) {
      issues.push("raw_response must be null, a JSON object, or valid JSON text.");
    }
  }

  if (Object.hasOwn(payload, "reviewed_by") && payload.reviewed_by !== null) {
    if (!hasText(payload.reviewed_by)) {
      issues.push("reviewed_by must be null or a user id.");
    }
  }

  if (Object.hasOwn(payload, "reviewed_at") && payload.reviewed_at !== null) {
    if (!hasText(payload.reviewed_at)) {
      issues.push("reviewed_at must be null or a timestamp string.");
    }
  }

  if (Object.hasOwn(payload, "disposition") && payload.disposition !== null) {
    const disposition = String(payload.disposition ?? "").trim().toUpperCase();
    if (!disposition) {
      issues.push("disposition must be null or a supported value.");
    } else if (!DISPOSITIONS.has(disposition)) {
      issues.push("disposition must be one of CONFIRMED_MATCH, CLEARED, or ESCALATED.");
    }
  }

  return issues;
}

function getUboScreeningResultRowById(db, resultId) {
  return db
    .prepare(
      `SELECT result_id, ubo_id, screening_type, provider, result_status,
              match_score, raw_response, reviewed_by, reviewed_at,
              disposition, created_at
         FROM ubo_screening_results
        WHERE result_id = ?`,
    )
    .get(resultId);
}

export function listUboScreeningResults(db, filters = {}) {
  const conditions = [];
  const values = [];

  if (hasText(filters.ubo_id)) {
    conditions.push("ubo_id = ?");
    values.push(String(filters.ubo_id).trim());
  }

  if (hasText(filters.screening_type)) {
    conditions.push("screening_type = ?");
    values.push(String(filters.screening_type).trim().toUpperCase());
  }

  if (hasText(filters.result_status)) {
    conditions.push("result_status = ?");
    values.push(String(filters.result_status).trim().toUpperCase());
  }

  if (hasText(filters.disposition)) {
    conditions.push("disposition = ?");
    values.push(String(filters.disposition).trim().toUpperCase());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT result_id, ubo_id, screening_type, provider, result_status,
              match_score, raw_response, reviewed_by, reviewed_at,
              disposition, created_at
         FROM ubo_screening_results
         ${whereClause}
        ORDER BY created_at DESC, screening_type ASC`,
    )
    .all(...values);

  return {
    ubo_screening_results: rows.map(normalizeUboScreeningResultRow),
  };
}

export function getUboScreeningResultById(db, resultId) {
  const row = getUboScreeningResultRowById(db, resultId);

  if (!row) {
    return {
      error: "UBO screening result not found.",
      resultId,
    };
  }

  return {
    ubo_screening_result: normalizeUboScreeningResultRow(row),
  };
}

export function createUboScreeningResult(db, payload) {
  const issues = collectUboScreeningResultValidationIssues(db, payload);

  if (issues.length > 0) {
    return {
      error: "UBO screening result validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO ubo_screening_results (
       ubo_id, screening_type, provider, result_status, match_score,
       raw_response, reviewed_by, reviewed_at, disposition
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    String(payload.ubo_id).trim(),
    String(payload.screening_type).trim().toUpperCase(),
    normalizeNullableText(payload.provider),
    String(payload.result_status).trim().toUpperCase(),
    normalizeNullableNumber(payload.match_score),
    normalizeRawResponse(payload.raw_response),
    normalizeNullableText(payload.reviewed_by),
    normalizeNullableText(payload.reviewed_at),
    payload.disposition === null || payload.disposition === undefined
      ? null
      : String(payload.disposition).trim().toUpperCase(),
  );

  const row = db
    .prepare(
      `SELECT result_id, ubo_id, screening_type, provider, result_status,
              match_score, raw_response, reviewed_by, reviewed_at,
              disposition, created_at
         FROM ubo_screening_results
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    ubo_screening_result: normalizeUboScreeningResultRow(row),
  };
}

export function updateUboScreeningResult(db, resultId, payload) {
  const existing = db
    .prepare("SELECT result_id FROM ubo_screening_results WHERE result_id = ?")
    .get(resultId);

  if (!existing) {
    return {
      error: "UBO screening result not found.",
      resultId,
    };
  }

  const issues = collectUboScreeningResultValidationIssues(db, payload, {
    partial: true,
  });
  if (issues.length > 0) {
    return {
      error: "UBO screening result validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "ubo_id")) {
    updates.push("ubo_id = ?");
    values.push(String(payload.ubo_id).trim());
  }

  if (Object.hasOwn(payload, "screening_type")) {
    updates.push("screening_type = ?");
    values.push(String(payload.screening_type).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "provider")) {
    updates.push("provider = ?");
    values.push(payload.provider === null ? null : String(payload.provider).trim());
  }

  if (Object.hasOwn(payload, "result_status")) {
    updates.push("result_status = ?");
    values.push(String(payload.result_status).trim().toUpperCase());
  }

  if (Object.hasOwn(payload, "match_score")) {
    updates.push("match_score = ?");
    values.push(normalizeNullableNumber(payload.match_score));
  }

  if (Object.hasOwn(payload, "raw_response")) {
    updates.push("raw_response = ?");
    values.push(normalizeRawResponse(payload.raw_response));
  }

  if (Object.hasOwn(payload, "reviewed_by")) {
    updates.push("reviewed_by = ?");
    values.push(payload.reviewed_by === null ? null : String(payload.reviewed_by).trim());
  }

  if (Object.hasOwn(payload, "reviewed_at")) {
    updates.push("reviewed_at = ?");
    values.push(payload.reviewed_at === null ? null : String(payload.reviewed_at).trim());
  }

  if (Object.hasOwn(payload, "disposition")) {
    updates.push("disposition = ?");
    values.push(
      payload.disposition === null
        ? null
        : String(payload.disposition).trim().toUpperCase(),
    );
  }

  if (updates.length > 0) {
    db.prepare(
      `UPDATE ubo_screening_results SET ${updates.join(", ")} WHERE result_id = ?`,
    ).run(...values, resultId);
  }

  return getUboScreeningResultById(db, resultId);
}

export function deleteUboScreeningResult(db, resultId) {
  const existing = getUboScreeningResultById(db, resultId);

  if (!existing.ubo_screening_result) {
    return {
      error: "UBO screening result not found.",
      resultId,
    };
  }

  db.prepare("DELETE FROM ubo_screening_results WHERE result_id = ?").run(resultId);

  return {
    deleted: true,
    resultId,
    ubo_screening_result: existing.ubo_screening_result,
  };
}
