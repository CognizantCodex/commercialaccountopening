import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  createUbo,
  deleteUbo,
  getUboById,
  listUbos,
  updateUbo,
} from "./uboApi.js";

function createDatabase() {
  const database = new DatabaseSync(":memory:");

  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE entity (
      entity_id TEXT PRIMARY KEY,
      legal_name TEXT NOT NULL
    );
    CREATE TABLE ubos (
      ubo_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      entity_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      nationality TEXT NOT NULL,
      country_of_residence TEXT NOT NULL,
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      id_expiry_date TEXT,
      id_issuing_country TEXT,
      residential_address_line1 TEXT,
      residential_address_line2 TEXT,
      residential_city TEXT,
      residential_state TEXT,
      residential_postal_code TEXT,
      residential_country TEXT,
      ownership_pct NUMERIC NOT NULL,
      control_type TEXT,
      control_title TEXT,
      is_control_person INTEGER NOT NULL DEFAULT 0,
      cdd_verification_status TEXT NOT NULL DEFAULT 'PENDING',
      cdd_verification_method TEXT,
      cdd_verified_at TEXT,
      cdd_certification_date TEXT,
      cdd_certified_by TEXT,
      is_pep INTEGER NOT NULL DEFAULT 0,
      is_sanctioned INTEGER NOT NULL DEFAULT 0,
      is_adverse_media INTEGER NOT NULL DEFAULT 0,
      screening_status TEXT NOT NULL DEFAULT 'PENDING',
      last_screened_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entity_id) REFERENCES entity(entity_id)
    );
  `);

  database
    .prepare("INSERT INTO entity (entity_id, legal_name) VALUES (?, ?)")
    .run("entity-1", "Northwind Treasury LLC");

  return database;
}

function createValidPayload(overrides = {}) {
  return {
    entity_id: "entity-1",
    first_name: "Alex",
    last_name: "Morgan",
    date_of_birth: "1985-04-12",
    nationality: "us",
    country_of_residence: "gb",
    id_type: "passport",
    id_number: "P1234567",
    id_expiry_date: "2030-10-31",
    id_issuing_country: "us",
    residential_address_line1: "100 Market Street",
    residential_address_line2: "Apt 9",
    residential_city: "New York",
    residential_state: "NY",
    residential_postal_code: "10005",
    residential_country: "us",
    ownership_pct: 32.5,
    control_type: "direct_ownership",
    control_title: "Chief Executive Officer",
    is_control_person: true,
    cdd_verification_status: "verified",
    cdd_verification_method: "documentary",
    cdd_verified_at: "2026-04-28T10:00:00Z",
    cdd_certification_date: "2026-04-28",
    cdd_certified_by: "applicant-1",
    is_pep: false,
    is_sanctioned: false,
    is_adverse_media: true,
    screening_status: "flagged",
    last_screened_at: "2026-04-23T12:30:00Z",
    ...overrides,
  };
}

describe("uboApi", () => {
  it("creates and returns a normalized UBO record", () => {
    const database = createDatabase();

    const result = createUbo(database, createValidPayload());

    expect(result.ubo).toMatchObject({
      entity_id: "entity-1",
      first_name: "Alex",
      last_name: "Morgan",
      nationality: "US",
      country_of_residence: "GB",
      id_type: "PASSPORT",
      id_issuing_country: "US",
      residential_address_line1: "100 Market Street",
      residential_country: "US",
      control_type: "DIRECT_OWNERSHIP",
      control_title: "Chief Executive Officer",
      is_control_person: true,
      cdd_verification_status: "VERIFIED",
      cdd_verification_method: "DOCUMENTARY",
      screening_status: "FLAGGED",
      is_pep: false,
      is_sanctioned: false,
      is_adverse_media: true,
      ownership_pct: 32.5,
    });

    expect(result.ubo.ubo_id).toBeTypeOf("string");
  });

  it("lists UBOS and supports filtering by entity_id", () => {
    const database = createDatabase();
    const created = createUbo(database, createValidPayload()).ubo;

    expect(listUbos(database)).toEqual({
      ubos: [expect.objectContaining({ ubo_id: created.ubo_id })],
    });

    expect(listUbos(database, "entity-1")).toEqual({
      ubos: [expect.objectContaining({ ubo_id: created.ubo_id })],
    });

    expect(listUbos(database, "missing-entity")).toEqual({ ubos: [] });
  });

  it("gets, updates, and deletes a UBO by id", () => {
    const database = createDatabase();
    const created = createUbo(database, createValidPayload()).ubo;

    expect(getUboById(database, created.ubo_id)).toEqual({
      ubo: expect.objectContaining({
        ubo_id: created.ubo_id,
        first_name: "Alex",
      }),
    });

    const updated = updateUbo(database, created.ubo_id, {
      ownership_pct: 55,
      screening_status: "clear",
      cdd_verification_status: "pending",
      is_control_person: false,
      is_pep: true,
    });

    expect(updated).toEqual({
      ubo: expect.objectContaining({
        ubo_id: created.ubo_id,
        ownership_pct: 55,
        screening_status: "CLEAR",
        cdd_verification_status: "PENDING",
        is_control_person: false,
        is_pep: true,
      }),
    });

    expect(deleteUbo(database, created.ubo_id)).toEqual({
      deleted: true,
      uboId: created.ubo_id,
      ubo: expect.objectContaining({ ubo_id: created.ubo_id }),
    });

    expect(getUboById(database, created.ubo_id)).toEqual({
      error: "UBO not found.",
      uboId: created.ubo_id,
    });
  });

  it("rejects invalid payloads and unknown entity references", () => {
    const database = createDatabase();

    expect(
      createUbo(
        database,
        createValidPayload({
          entity_id: "missing-entity",
          ownership_pct: 125,
          nationality: "USA",
          id_type: "ALIEN_ID",
          residential_country: "USA",
          cdd_verification_status: "UNKNOWN",
          cdd_verification_method: "PHONE_CALL",
        }),
      ),
    ).toEqual({
      error: "UBO validation failed.",
      issues: expect.arrayContaining([
        "entity_id does not reference an existing entity.",
        "ownership_pct must be between 0 and 100.",
        "nationality must be a 2-character ISO country code.",
        "id_type must be one of PASSPORT, NATIONAL_ID, DRIVERS_LICENSE, or OTHER_GOVERNMENT_ID.",
        "residential_country must be a 2-character ISO country code.",
        "cdd_verification_status must be one of PENDING, VERIFIED, FAILED, or EXEMPT.",
        "cdd_verification_method must be one of DOCUMENTARY, NON_DOCUMENTARY, BOTH, or RELIANCE.",
      ]),
    });
  });
});
