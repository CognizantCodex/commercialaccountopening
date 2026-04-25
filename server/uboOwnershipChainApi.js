function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
}

function normalizeOwnershipChainRow(row) {
  if (!row) {
    return null;
  }

  return {
    chain_id: row.chain_id,
    ubo_id: row.ubo_id,
    parent_entity_id: row.parent_entity_id,
    child_entity_id: row.child_entity_id,
    ownership_pct: Number(row.ownership_pct),
    chain_depth: Number(row.chain_depth),
    effective_ownership:
      row.effective_ownership === null || row.effective_ownership === undefined
        ? null
        : Number(row.effective_ownership),
    created_at: row.created_at,
  };
}

function uboExists(db, uboId) {
  return Boolean(db.prepare("SELECT ubo_id FROM ubos WHERE ubo_id = ?").get(uboId));
}

function entityExists(db, entityId) {
  return Boolean(
    db.prepare("SELECT entity_id FROM entity WHERE entity_id = ?").get(entityId),
  );
}

function collectOwnershipChainValidationIssues(db, payload, { partial = false } = {}) {
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

  if (!partial || Object.hasOwn(payload, "parent_entity_id")) {
    if (!hasText(payload.parent_entity_id)) {
      issues.push("parent_entity_id is required.");
    } else if (!entityExists(db, String(payload.parent_entity_id).trim())) {
      issues.push("parent_entity_id does not reference an existing entity.");
    }
  }

  if (!partial || Object.hasOwn(payload, "child_entity_id")) {
    if (!hasText(payload.child_entity_id)) {
      issues.push("child_entity_id is required.");
    } else if (!entityExists(db, String(payload.child_entity_id).trim())) {
      issues.push("child_entity_id does not reference an existing entity.");
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

  if (Object.hasOwn(payload, "chain_depth")) {
    const chainDepth = Number(payload.chain_depth);
    if (!Number.isInteger(chainDepth)) {
      issues.push("chain_depth must be an integer.");
    } else if (chainDepth < 1) {
      issues.push("chain_depth must be greater than or equal to 1.");
    }
  }

  if (Object.hasOwn(payload, "effective_ownership")) {
    const effectiveOwnership = normalizeNullableNumber(payload.effective_ownership);
    if (effectiveOwnership !== null && Number.isNaN(effectiveOwnership)) {
      issues.push("effective_ownership must be null or a number.");
    } else if (
      effectiveOwnership !== null &&
      (effectiveOwnership < 0 || effectiveOwnership > 100)
    ) {
      issues.push("effective_ownership must be between 0 and 100.");
    }
  }

  return issues;
}

function getOwnershipChainRowById(db, chainId) {
  return db
    .prepare(
      `SELECT chain_id, ubo_id, parent_entity_id, child_entity_id,
              ownership_pct, chain_depth, effective_ownership, created_at
         FROM ubo_ownership_chain
        WHERE chain_id = ?`,
    )
    .get(chainId);
}

export function listUboOwnershipChains(db, filters = {}) {
  const conditions = [];
  const values = [];

  if (hasText(filters.ubo_id)) {
    conditions.push("ubo_id = ?");
    values.push(String(filters.ubo_id).trim());
  }

  if (hasText(filters.parent_entity_id)) {
    conditions.push("parent_entity_id = ?");
    values.push(String(filters.parent_entity_id).trim());
  }

  if (hasText(filters.child_entity_id)) {
    conditions.push("child_entity_id = ?");
    values.push(String(filters.child_entity_id).trim());
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT chain_id, ubo_id, parent_entity_id, child_entity_id,
              ownership_pct, chain_depth, effective_ownership, created_at
         FROM ubo_ownership_chain
         ${whereClause}
        ORDER BY chain_depth ASC, created_at DESC`,
    )
    .all(...values);

  return {
    ownership_chains: rows.map(normalizeOwnershipChainRow),
  };
}

export function getUboOwnershipChainById(db, chainId) {
  const row = getOwnershipChainRowById(db, chainId);

  if (!row) {
    return {
      error: "UBO ownership chain not found.",
      chainId,
    };
  }

  return {
    ownership_chain: normalizeOwnershipChainRow(row),
  };
}

export function createUboOwnershipChain(db, payload) {
  const issues = collectOwnershipChainValidationIssues(db, payload);

  if (issues.length > 0) {
    return {
      error: "UBO ownership chain validation failed.",
      issues,
    };
  }

  db.prepare(
    `INSERT INTO ubo_ownership_chain (
       ubo_id, parent_entity_id, child_entity_id, ownership_pct,
       chain_depth, effective_ownership
     ) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    String(payload.ubo_id).trim(),
    String(payload.parent_entity_id).trim(),
    String(payload.child_entity_id).trim(),
    Number(payload.ownership_pct),
    Object.hasOwn(payload, "chain_depth") ? Number(payload.chain_depth) : 1,
    normalizeNullableNumber(payload.effective_ownership),
  );

  const row = db
    .prepare(
      `SELECT chain_id, ubo_id, parent_entity_id, child_entity_id,
              ownership_pct, chain_depth, effective_ownership, created_at
         FROM ubo_ownership_chain
        WHERE rowid = last_insert_rowid()`,
    )
    .get();

  return {
    ownership_chain: normalizeOwnershipChainRow(row),
  };
}

export function updateUboOwnershipChain(db, chainId, payload) {
  const existing = db
    .prepare("SELECT chain_id FROM ubo_ownership_chain WHERE chain_id = ?")
    .get(chainId);

  if (!existing) {
    return {
      error: "UBO ownership chain not found.",
      chainId,
    };
  }

  const issues = collectOwnershipChainValidationIssues(db, payload, { partial: true });
  if (issues.length > 0) {
    return {
      error: "UBO ownership chain validation failed.",
      issues,
    };
  }

  const updates = [];
  const values = [];

  if (Object.hasOwn(payload, "ubo_id")) {
    updates.push("ubo_id = ?");
    values.push(String(payload.ubo_id).trim());
  }

  if (Object.hasOwn(payload, "parent_entity_id")) {
    updates.push("parent_entity_id = ?");
    values.push(String(payload.parent_entity_id).trim());
  }

  if (Object.hasOwn(payload, "child_entity_id")) {
    updates.push("child_entity_id = ?");
    values.push(String(payload.child_entity_id).trim());
  }

  if (Object.hasOwn(payload, "ownership_pct")) {
    updates.push("ownership_pct = ?");
    values.push(Number(payload.ownership_pct));
  }

  if (Object.hasOwn(payload, "chain_depth")) {
    updates.push("chain_depth = ?");
    values.push(Number(payload.chain_depth));
  }

  if (Object.hasOwn(payload, "effective_ownership")) {
    updates.push("effective_ownership = ?");
    values.push(normalizeNullableNumber(payload.effective_ownership));
  }

  if (updates.length > 0) {
    db.prepare(`UPDATE ubo_ownership_chain SET ${updates.join(", ")} WHERE chain_id = ?`).run(
      ...values,
      chainId,
    );
  }

  return getUboOwnershipChainById(db, chainId);
}

export function deleteUboOwnershipChain(db, chainId) {
  const existing = getUboOwnershipChainById(db, chainId);

  if (!existing.ownership_chain) {
    return {
      error: "UBO ownership chain not found.",
      chainId,
    };
  }

  db.prepare("DELETE FROM ubo_ownership_chain WHERE chain_id = ?").run(chainId);

  return {
    deleted: true,
    chainId,
    ownership_chain: existing.ownership_chain,
  };
}
