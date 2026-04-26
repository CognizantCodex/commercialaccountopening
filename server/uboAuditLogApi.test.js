import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  createUboAuditLog,
  deleteUboAuditLog,
  getUboAuditLogById,
  listUboAuditLogs,
  updateUboAuditLog,
} from "./uboAuditLogApi.js";

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
    CREATE TABLE ubo_audit_log (
      log_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      entity_id TEXT REFERENCES entity(entity_id),
      ubo_id TEXT REFERENCES ubos(ubo_id),
      action VARCHAR(50) NOT NULL,
      performed_by TEXT NOT NULL,
      ip_address TEXT,
      changes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (action IN ('CREATED', 'UPDATED', 'SCREENED', 'APPROVED', 'REJECTED')),
      CHECK (changes IS NULL OR json_valid(changes)),
      CHECK (ip_address IS NULL OR instr(ip_address, '.') > 0 OR instr(ip_address, ':') > 0)
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
    entity_id: "entity-1",
    ubo_id: "ubo-1",
    action: "screened",
    performed_by: "analyst-1",
    ip_address: "192.0.2.25",
    changes: {
      screening_status: {
        old: "PENDING",
        new: "CLEAR",
      },
    },
    ...overrides,
  };
}

describe("uboAuditLogApi", () => {
  it("creates and returns a normalized audit log", () => {
    const database = createDatabase();

    const result = createUboAuditLog(database, createValidPayload());

    expect(result.ubo_audit_log).toMatchObject({
      entity_id: "entity-1",
      ubo_id: "ubo-1",
      action: "SCREENED",
      performed_by: "analyst-1",
      ip_address: "192.0.2.25",
      changes: {
        screening_status: {
          old: "PENDING",
          new: "CLEAR",
        },
      },
    });
    expect(result.ubo_audit_log.log_id).toBeTypeOf("string");
  });

  it("lists audit logs and supports filters", () => {
    const database = createDatabase();
    const created = createUboAuditLog(database, createValidPayload()).ubo_audit_log;

    expect(listUboAuditLogs(database)).toEqual({
      ubo_audit_logs: [expect.objectContaining({ log_id: created.log_id })],
    });
    expect(listUboAuditLogs(database, { ubo_id: "ubo-1" })).toEqual({
      ubo_audit_logs: [expect.objectContaining({ log_id: created.log_id })],
    });
    expect(listUboAuditLogs(database, { action: "approved" })).toEqual({
      ubo_audit_logs: [],
    });
  });

  it("gets, updates, and deletes an audit log by id", () => {
    const database = createDatabase();
    const created = createUboAuditLog(database, createValidPayload()).ubo_audit_log;

    expect(getUboAuditLogById(database, created.log_id)).toEqual({
      ubo_audit_log: expect.objectContaining({
        log_id: created.log_id,
        action: "SCREENED",
      }),
    });

    expect(
      updateUboAuditLog(database, created.log_id, {
        action: "approved",
        performed_by: "approver-1",
        ip_address: "2001:db8::1",
        changes: '{"approval_status":{"old":"PENDING","new":"APPROVED"}}',
      }),
    ).toEqual({
      ubo_audit_log: expect.objectContaining({
        log_id: created.log_id,
        action: "APPROVED",
        performed_by: "approver-1",
        ip_address: "2001:db8::1",
        changes: {
          approval_status: {
            old: "PENDING",
            new: "APPROVED",
          },
        },
      }),
    });

    expect(deleteUboAuditLog(database, created.log_id)).toEqual({
      deleted: true,
      logId: created.log_id,
      ubo_audit_log: expect.objectContaining({
        log_id: created.log_id,
      }),
    });
    expect(getUboAuditLogById(database, created.log_id)).toEqual({
      error: "UBO audit log not found.",
      logId: created.log_id,
    });
  });

  it("rejects invalid payloads and unknown references", () => {
    const database = createDatabase();

    expect(
      createUboAuditLog(
        database,
        createValidPayload({
          entity_id: "missing-entity",
          ubo_id: "missing-ubo",
          action: "archived",
          performed_by: "",
          ip_address: "localhost",
          changes: "{not-json",
        }),
      ),
    ).toEqual({
      error: "UBO audit log validation failed.",
      issues: expect.arrayContaining([
        "entity_id does not reference an existing entity.",
        "ubo_id does not reference an existing UBO.",
        "action must be one of CREATED, UPDATED, SCREENED, APPROVED, or REJECTED.",
        "performed_by is required.",
        "ip_address must be null or a valid IP address string.",
        "changes must be null, a JSON object, or valid JSON text.",
      ]),
    });
  });
});
