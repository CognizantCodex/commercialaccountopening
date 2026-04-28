import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { createEntity, updateEntity } from "./entityApi.js";

function createDatabase() {
  const database = new DatabaseSync(":memory:");

  database.exec(`
    CREATE TABLE entity (
      entity_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      legal_name TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      jurisdiction CHAR(2) NOT NULL,
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
  `);

  return database;
}

function createValidPayload(overrides = {}) {
  return {
    legal_name: "Northwind Treasury LLC",
    entity_type: "Limited Liability Company",
    jurisdiction: "us",
    registration_no: "NW-123",
    tax_id: "12-3456789",
    industry: "Technology services",
    risk_rating: "medium",
    ...overrides,
  };
}

describe("entityApi", () => {
  it("derives naics_code from supported industry during entity creation", () => {
    const database = createDatabase();

    const result = createEntity(database, createValidPayload());

    expect(result.entity).toMatchObject({
      legal_name: "Northwind Treasury LLC",
      jurisdiction: "US",
      naics_code: "541512",
      risk_rating: "MEDIUM",
    });
  });

  it("allows explicit naics_code and updates naics_code from industry", () => {
    const database = createDatabase();
    const created = createEntity(
      database,
      createValidPayload({ naics_code: "541611", industry: "" }),
    ).entity;

    expect(created.naics_code).toBe("541611");

    expect(
      updateEntity(database, created.entity_id, {
        industry: "Healthcare services",
      }),
    ).toEqual({
      entity: expect.objectContaining({
        entity_id: created.entity_id,
        naics_code: "621999",
      }),
    });
  });

  it("rejects entity creation when naics_code cannot be derived", () => {
    const database = createDatabase();

    expect(
      createEntity(
        database,
        createValidPayload({
          naics_code: "",
          industry: "Unknown industry",
        }),
      ),
    ).toEqual({
      error: "Entity validation failed.",
      issues: [
        "naics_code is required or must be derivable from a supported industry.",
      ],
    });

    expect(createEntity(database, createValidPayload({ naics_code: "ABC" }))).toEqual({
      error: "Entity validation failed.",
      issues: ["naics_code must contain 2 to 6 digits."],
    });
  });
});
