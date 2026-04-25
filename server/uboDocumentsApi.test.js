import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  createUboDocument,
  deleteUboDocument,
  getUboDocumentById,
  listUboDocuments,
  updateUboDocument,
} from "./uboDocumentsApi.js";

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
    CREATE TABLE ubo_documents (
      doc_id TEXT PRIMARY KEY DEFAULT (
        lower(hex(randomblob(4))) || '-' ||
        lower(hex(randomblob(2))) || '-' ||
        '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
        substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
        lower(hex(randomblob(6)))
      ),
      ubo_id TEXT NOT NULL REFERENCES ubos(ubo_id),
      doc_type VARCHAR(50) NOT NULL,
      file_ref VARCHAR(500) NOT NULL,
      file_hash VARCHAR(64),
      upload_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      verified_by TEXT,
      verified_at TEXT,
      expiry_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CHECK (doc_type IN ('ID_PROOF', 'ADDRESS_PROOF', 'OWNERSHIP_CERT')),
      CHECK (upload_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
      CHECK (file_hash IS NULL OR length(file_hash) = 64)
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
    doc_type: "id_proof",
    file_ref: "vault://ubo-documents/ubo-1/passport.pdf",
    file_hash: "a".repeat(64),
    upload_status: "pending",
    verified_by: null,
    verified_at: null,
    expiry_date: "2031-05-01",
    ...overrides,
  };
}

describe("uboDocumentsApi", () => {
  it("creates and returns a normalized UBO document record", () => {
    const database = createDatabase();

    const result = createUboDocument(database, createValidPayload());

    expect(result.ubo_document).toMatchObject({
      ubo_id: "ubo-1",
      doc_type: "ID_PROOF",
      file_ref: "vault://ubo-documents/ubo-1/passport.pdf",
      file_hash: "a".repeat(64),
      upload_status: "PENDING",
      verified_by: null,
      verified_at: null,
      expiry_date: "2031-05-01",
    });
    expect(result.ubo_document.doc_id).toBeTypeOf("string");
  });

  it("lists documents and supports filters", () => {
    const database = createDatabase();
    const created = createUboDocument(database, createValidPayload()).ubo_document;

    expect(listUboDocuments(database)).toEqual({
      ubo_documents: [expect.objectContaining({ doc_id: created.doc_id })],
    });
    expect(listUboDocuments(database, { ubo_id: "ubo-1" })).toEqual({
      ubo_documents: [expect.objectContaining({ doc_id: created.doc_id })],
    });
    expect(listUboDocuments(database, { doc_type: "address_proof" })).toEqual({
      ubo_documents: [],
    });
  });

  it("gets, updates, and deletes a document by id", () => {
    const database = createDatabase();
    const created = createUboDocument(database, createValidPayload()).ubo_document;

    expect(getUboDocumentById(database, created.doc_id)).toEqual({
      ubo_document: expect.objectContaining({
        doc_id: created.doc_id,
        upload_status: "PENDING",
      }),
    });

    expect(
      updateUboDocument(database, created.doc_id, {
        upload_status: "verified",
        verified_by: "analyst-1",
        verified_at: "2026-04-25T03:00:00Z",
      }),
    ).toEqual({
      ubo_document: expect.objectContaining({
        doc_id: created.doc_id,
        upload_status: "VERIFIED",
        verified_by: "analyst-1",
        verified_at: "2026-04-25T03:00:00Z",
      }),
    });

    expect(deleteUboDocument(database, created.doc_id)).toEqual({
      deleted: true,
      docId: created.doc_id,
      ubo_document: expect.objectContaining({ doc_id: created.doc_id }),
    });
    expect(getUboDocumentById(database, created.doc_id)).toEqual({
      error: "UBO document not found.",
      docId: created.doc_id,
    });
  });

  it("rejects invalid payloads and unknown UBO references", () => {
    const database = createDatabase();

    expect(
      createUboDocument(
        database,
        createValidPayload({
          ubo_id: "missing-ubo",
          doc_type: "unsupported",
          file_ref: "",
          file_hash: "not-a-sha",
          upload_status: "uploaded",
          expiry_date: "05/01/2031",
        }),
      ),
    ).toEqual({
      error: "UBO document validation failed.",
      issues: expect.arrayContaining([
        "ubo_id does not reference an existing UBO.",
        "doc_type must be one of ID_PROOF, ADDRESS_PROOF, or OWNERSHIP_CERT.",
        "file_ref is required.",
        "file_hash must be a 64-character hexadecimal SHA-256 hash.",
        "upload_status must be one of PENDING, VERIFIED, or REJECTED.",
        "expiry_date must be in YYYY-MM-DD format.",
      ]),
    });
  });
});
