import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  createUboOwnershipChain,
  deleteUboOwnershipChain,
  getUboOwnershipChainById,
  listUboOwnershipChains,
  updateUboOwnershipChain,
} from "./uboOwnershipChainApi.js";

function createDatabase() {
  const database = new DatabaseSync(":memory:");

  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE entity (
      entity_id TEXT PRIMARY KEY,
      legal_name TEXT NOT NULL
    );
    CREATE TABLE ubos (
      ubo_id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entity(entity_id)
    );
    CREATE TABLE ubo_ownership_chain (
      chain_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      ubo_id TEXT NOT NULL REFERENCES ubos(ubo_id),
      parent_entity_id TEXT NOT NULL REFERENCES entity(entity_id),
      child_entity_id TEXT NOT NULL REFERENCES entity(entity_id),
      ownership_pct NUMERIC(5,2) NOT NULL,
      chain_depth INTEGER NOT NULL DEFAULT 1,
      effective_ownership NUMERIC(5,2),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (ownership_pct >= 0 AND ownership_pct <= 100),
      CHECK (effective_ownership IS NULL OR (effective_ownership >= 0 AND effective_ownership <= 100)),
      CHECK (chain_depth >= 1)
    );
  `);

  database
    .prepare("INSERT INTO entity (entity_id, legal_name) VALUES (?, ?), (?, ?)")
    .run("entity-parent", "Northwind Holdings LLC", "entity-child", "Northwind Treasury LLC");
  database
    .prepare(
      `INSERT INTO ubos (ubo_id, entity_id, first_name, last_name)
       VALUES (?, ?, ?, ?)`,
    )
    .run("ubo-1", "entity-child", "Alex", "Morgan");

  return database;
}

function createValidPayload(overrides = {}) {
  return {
    ubo_id: "ubo-1",
    parent_entity_id: "entity-parent",
    child_entity_id: "entity-child",
    ownership_pct: 75.5,
    chain_depth: 2,
    effective_ownership: 37.75,
    ...overrides,
  };
}

describe("uboOwnershipChainApi", () => {
  it("creates and returns a normalized ownership chain record", () => {
    const database = createDatabase();

    const result = createUboOwnershipChain(database, createValidPayload());

    expect(result.ownership_chain).toMatchObject({
      ubo_id: "ubo-1",
      parent_entity_id: "entity-parent",
      child_entity_id: "entity-child",
      ownership_pct: 75.5,
      chain_depth: 2,
      effective_ownership: 37.75,
    });
    expect(result.ownership_chain.chain_id).toBeTypeOf("string");
  });

  it("lists ownership chains and supports filters", () => {
    const database = createDatabase();
    const created = createUboOwnershipChain(database, createValidPayload()).ownership_chain;

    expect(listUboOwnershipChains(database)).toEqual({
      ownership_chains: [expect.objectContaining({ chain_id: created.chain_id })],
    });
    expect(listUboOwnershipChains(database, { ubo_id: "ubo-1" })).toEqual({
      ownership_chains: [expect.objectContaining({ chain_id: created.chain_id })],
    });
    expect(listUboOwnershipChains(database, { parent_entity_id: "missing" })).toEqual({
      ownership_chains: [],
    });
  });

  it("gets, updates, and deletes an ownership chain by id", () => {
    const database = createDatabase();
    const created = createUboOwnershipChain(database, createValidPayload()).ownership_chain;

    expect(getUboOwnershipChainById(database, created.chain_id)).toEqual({
      ownership_chain: expect.objectContaining({
        chain_id: created.chain_id,
        ownership_pct: 75.5,
      }),
    });

    expect(
      updateUboOwnershipChain(database, created.chain_id, {
        ownership_pct: 60,
        effective_ownership: null,
        chain_depth: 3,
      }),
    ).toEqual({
      ownership_chain: expect.objectContaining({
        chain_id: created.chain_id,
        ownership_pct: 60,
        effective_ownership: null,
        chain_depth: 3,
      }),
    });

    expect(deleteUboOwnershipChain(database, created.chain_id)).toEqual({
      deleted: true,
      chainId: created.chain_id,
      ownership_chain: expect.objectContaining({ chain_id: created.chain_id }),
    });
    expect(getUboOwnershipChainById(database, created.chain_id)).toEqual({
      error: "UBO ownership chain not found.",
      chainId: created.chain_id,
    });
  });

  it("rejects invalid payloads and unknown references", () => {
    const database = createDatabase();

    expect(
      createUboOwnershipChain(
        database,
        createValidPayload({
          ubo_id: "missing-ubo",
          parent_entity_id: "missing-parent",
          ownership_pct: 120,
          chain_depth: 0,
        }),
      ),
    ).toEqual({
      error: "UBO ownership chain validation failed.",
      issues: expect.arrayContaining([
        "ubo_id does not reference an existing UBO.",
        "parent_entity_id does not reference an existing entity.",
        "ownership_pct must be between 0 and 100.",
        "chain_depth must be greater than or equal to 1.",
      ]),
    });
  });
});
