import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  createUboScreeningResult,
  deleteUboScreeningResult,
  getUboScreeningResultById,
  listUboScreeningResults,
  updateUboScreeningResult,
} from "./uboScreeningResultsApi.js";

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
    CREATE TABLE ubo_screening_results (
      result_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      ubo_id TEXT NOT NULL REFERENCES ubos(ubo_id),
      screening_type VARCHAR(30) NOT NULL,
      provider VARCHAR(50),
      result_status VARCHAR(20) NOT NULL,
      match_score NUMERIC(5,2),
      raw_response TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      disposition VARCHAR(30),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (screening_type IN ('SANCTIONS', 'PEP', 'ADVERSE_MEDIA', 'WATCHLIST')),
      CHECK (result_status IN ('CLEAR', 'HIT', 'POTENTIAL_MATCH', 'FALSE_POSITIVE')),
      CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
      CHECK (raw_response IS NULL OR json_valid(raw_response)),
      CHECK (disposition IS NULL OR disposition IN ('CONFIRMED_MATCH', 'CLEARED', 'ESCALATED'))
    );
  `);

  database
    .prepare("INSERT INTO entity (entity_id, legal_name) VALUES (?, ?)")
    .run("entity-1", "Northwind Treasury LLC");
  database
    .prepare(
      `INSERT INTO ubos (ubo_id, entity_id, first_name, last_name)
       VALUES (?, ?, ?, ?)`,
    )
    .run("ubo-1", "entity-1", "Alex", "Morgan");

  return database;
}

function createValidPayload(overrides = {}) {
  return {
    ubo_id: "ubo-1",
    screening_type: "sanctions",
    provider: "Refinitiv",
    result_status: "potential_match",
    match_score: 87.5,
    raw_response: {
      providerReference: "screening-123",
      matches: [{ list: "OFAC", score: 87.5 }],
    },
    reviewed_by: null,
    reviewed_at: null,
    disposition: null,
    ...overrides,
  };
}

describe("uboScreeningResultsApi", () => {
  it("creates and returns a normalized UBO screening result", () => {
    const database = createDatabase();

    const result = createUboScreeningResult(database, createValidPayload());

    expect(result.ubo_screening_result).toMatchObject({
      ubo_id: "ubo-1",
      screening_type: "SANCTIONS",
      provider: "Refinitiv",
      result_status: "POTENTIAL_MATCH",
      match_score: 87.5,
      raw_response: {
        providerReference: "screening-123",
        matches: [{ list: "OFAC", score: 87.5 }],
      },
      reviewed_by: null,
      reviewed_at: null,
      disposition: null,
    });
    expect(result.ubo_screening_result.result_id).toBeTypeOf("string");
  });

  it("lists screening results and supports filters", () => {
    const database = createDatabase();
    const created = createUboScreeningResult(database, createValidPayload())
      .ubo_screening_result;

    expect(listUboScreeningResults(database)).toEqual({
      ubo_screening_results: [
        expect.objectContaining({ result_id: created.result_id }),
      ],
    });
    expect(listUboScreeningResults(database, { ubo_id: "ubo-1" })).toEqual({
      ubo_screening_results: [
        expect.objectContaining({ result_id: created.result_id }),
      ],
    });
    expect(listUboScreeningResults(database, { screening_type: "pep" })).toEqual({
      ubo_screening_results: [],
    });
  });

  it("gets, updates, and deletes a screening result by id", () => {
    const database = createDatabase();
    const created = createUboScreeningResult(database, createValidPayload())
      .ubo_screening_result;

    expect(getUboScreeningResultById(database, created.result_id)).toEqual({
      ubo_screening_result: expect.objectContaining({
        result_id: created.result_id,
        result_status: "POTENTIAL_MATCH",
      }),
    });

    expect(
      updateUboScreeningResult(database, created.result_id, {
        result_status: "false_positive",
        match_score: 42,
        reviewed_by: "analyst-1",
        reviewed_at: "2026-04-26T13:00:00Z",
        disposition: "cleared",
        raw_response: '{"providerReference":"screening-123","reviewed":true}',
      }),
    ).toEqual({
      ubo_screening_result: expect.objectContaining({
        result_id: created.result_id,
        result_status: "FALSE_POSITIVE",
        match_score: 42,
        reviewed_by: "analyst-1",
        reviewed_at: "2026-04-26T13:00:00Z",
        disposition: "CLEARED",
        raw_response: {
          providerReference: "screening-123",
          reviewed: true,
        },
      }),
    });

    expect(deleteUboScreeningResult(database, created.result_id)).toEqual({
      deleted: true,
      resultId: created.result_id,
      ubo_screening_result: expect.objectContaining({
        result_id: created.result_id,
      }),
    });
    expect(getUboScreeningResultById(database, created.result_id)).toEqual({
      error: "UBO screening result not found.",
      resultId: created.result_id,
    });
  });

  it("rejects invalid payloads and unknown UBO references", () => {
    const database = createDatabase();

    expect(
      createUboScreeningResult(
        database,
        createValidPayload({
          ubo_id: "missing-ubo",
          screening_type: "credit_check",
          provider: "x".repeat(51),
          result_status: "unknown",
          match_score: 101,
          raw_response: "{not-json",
          disposition: "closed",
        }),
      ),
    ).toEqual({
      error: "UBO screening result validation failed.",
      issues: expect.arrayContaining([
        "ubo_id does not reference an existing UBO.",
        "screening_type must be one of SANCTIONS, PEP, ADVERSE_MEDIA, or WATCHLIST.",
        "provider must be 50 characters or fewer.",
        "result_status must be one of CLEAR, HIT, POTENTIAL_MATCH, or FALSE_POSITIVE.",
        "match_score must be between 0 and 100.",
        "raw_response must be null, a JSON object, or valid JSON text.",
        "disposition must be one of CONFIRMED_MATCH, CLEARED, or ESCALATED.",
      ]),
    });
  });
});
