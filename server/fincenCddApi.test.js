import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  buildFincenCddAssessment,
  buildFincenCddAssessmentFromPayload,
} from "./fincenCddApi.js";

function createDatabase() {
  const database = new DatabaseSync(":memory:");

  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE entity (
      entity_id TEXT PRIMARY KEY,
      legal_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      registration_no TEXT,
      tax_id TEXT,
      lei_code TEXT,
      incorporation_dt TEXT,
      is_listed INTEGER NOT NULL DEFAULT 0,
      naics_code TEXT,
      risk_rating TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE ubos (
      ubo_id TEXT PRIMARY KEY,
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
    .prepare(
      `INSERT INTO entity (
         entity_id, legal_name, entity_type, jurisdiction, registration_no,
         tax_id, naics_code, risk_rating
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "entity-1",
      "Northwind Treasury LLC",
      "LLC",
      "US",
      "REG-123",
      "12-3456789",
      "541511",
      "LOW",
    );

  return database;
}

function insertUbo(database, overrides = {}) {
  const ubo = {
    ubo_id: "ubo-1",
    entity_id: "entity-1",
    first_name: "Alex",
    last_name: "Morgan",
    date_of_birth: "1985-04-12",
    nationality: "US",
    country_of_residence: "US",
    id_type: "PASSPORT",
    id_number: "P1234567",
    id_expiry_date: "2030-10-31",
    id_issuing_country: "US",
    residential_address_line1: "100 Market Street",
    residential_address_line2: null,
    residential_city: "New York",
    residential_state: "NY",
    residential_postal_code: "10005",
    residential_country: "US",
    ownership_pct: 35,
    control_type: "DIRECT_OWNERSHIP",
    control_title: "Chief Executive Officer",
    is_control_person: 1,
    cdd_verification_status: "VERIFIED",
    cdd_verification_method: "DOCUMENTARY",
    cdd_verified_at: "2026-04-28T10:00:00Z",
    cdd_certification_date: "2026-04-28",
    cdd_certified_by: "applicant-1",
    screening_status: "CLEAR",
    last_screened_at: "2026-04-28T11:00:00Z",
    ...overrides,
  };

  database
    .prepare(
      `INSERT INTO ubos (
         ubo_id, entity_id, first_name, last_name, date_of_birth,
         nationality, country_of_residence, id_type, id_number,
         id_expiry_date, id_issuing_country, residential_address_line1,
         residential_address_line2, residential_city, residential_state,
         residential_postal_code, residential_country, ownership_pct,
         control_type, control_title, is_control_person, cdd_verification_status,
         cdd_verification_method, cdd_verified_at, cdd_certification_date,
         cdd_certified_by, screening_status, last_screened_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ubo.ubo_id,
      ubo.entity_id,
      ubo.first_name,
      ubo.last_name,
      ubo.date_of_birth,
      ubo.nationality,
      ubo.country_of_residence,
      ubo.id_type,
      ubo.id_number,
      ubo.id_expiry_date,
      ubo.id_issuing_country,
      ubo.residential_address_line1,
      ubo.residential_address_line2,
      ubo.residential_city,
      ubo.residential_state,
      ubo.residential_postal_code,
      ubo.residential_country,
      ubo.ownership_pct,
      ubo.control_type,
      ubo.control_title,
      ubo.is_control_person,
      ubo.cdd_verification_status,
      ubo.cdd_verification_method,
      ubo.cdd_verified_at,
      ubo.cdd_certification_date,
      ubo.cdd_certified_by,
      ubo.screening_status,
      ubo.last_screened_at,
    );
}

describe("fincenCddApi", () => {
  it("returns a ready CDD assessment when ownership and control requirements are met", () => {
    const database = createDatabase();
    insertUbo(database);

    const result = buildFincenCddAssessment(database, "entity-1");

    expect(result.fincen_cdd_assessment).toMatchObject({
      cdd_ready: true,
      customer_identification: { status: "COMPLETE", missing_items: [] },
      customer_risk_profile: { status: "COMPLETE", missing_items: [] },
      ongoing_monitoring: { status: "COMPLETE", missing_items: [] },
      beneficial_ownership: {
        status: "COMPLETE",
        ownership_prong_ubos: [expect.objectContaining({ ubo_id: "ubo-1" })],
        control_prong_ubos: [expect.objectContaining({ ubo_id: "ubo-1" })],
        ubo_findings: [
          expect.objectContaining({
            ubo_id: "ubo-1",
            prongs: ["OWNERSHIP", "CONTROL"],
            missing_items: [],
          }),
        ],
      },
    });
  });

  it("reports missing CDD requirements for incomplete UBO records", () => {
    const database = createDatabase();
    insertUbo(database, {
      residential_address_line1: null,
      residential_city: null,
      is_control_person: 0,
      cdd_verification_status: "PENDING",
      cdd_verification_method: null,
      screening_status: "PENDING",
      last_screened_at: null,
    });

    const result = buildFincenCddAssessment(database, "entity-1");

    expect(result.fincen_cdd_assessment.cdd_ready).toBe(false);
    expect(result.fincen_cdd_assessment.missing_items).toEqual(
      expect.arrayContaining([
        "At least one control-prong individual",
        "Alex Morgan: Residential address line 1",
        "Alex Morgan: Residential city",
        "Alex Morgan: CDD identity verification status",
        "At least one completed UBO screening event",
        "Resolve pending UBO screening statuses",
      ]),
    );
  });

  it("supports assessment requests from a JSON payload", () => {
    const database = createDatabase();
    insertUbo(database);

    expect(buildFincenCddAssessmentFromPayload(database, { entity_id: "entity-1" }))
      .toHaveProperty("fincen_cdd_assessment.cdd_ready", true);
  });

  it("rejects missing or unknown entity ids", () => {
    const database = createDatabase();

    expect(buildFincenCddAssessment(database, "")).toEqual({
      error: "entity_id is required.",
    });
    expect(buildFincenCddAssessment(database, "missing-entity")).toEqual({
      error: "Entity not found.",
      entityId: "missing-entity",
    });
  });
});
