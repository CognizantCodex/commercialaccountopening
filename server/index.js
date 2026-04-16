import { access, mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { submitCheckRiskApplication } from "./checkRiskApi.js";
import { submitCheckKycApplication } from "./checkKycApi.js";
import { KycFailedError } from "./agents/kycAgent.js";
import {
  collectSubmissionIssues,
  orchestrateApplicationSubmission,
} from "./orchestrator.js";
import { defaultWorkspace } from "../src/defaultWorkspace.js";

const PORT = Number(process.env.PORT ?? 8080);
const PRIMARY_DRAFT_ID = "corporate-account-opening";
const dataDir = new URL("./data/", import.meta.url);
const kycFabricDistDir = fileURLToPath(new URL("../frontend/dist/", import.meta.url));
const databasePath = fileURLToPath(
  new URL("./data/corporate-account-opening.sqlite", import.meta.url),
);
const legacyWorkspacePath = new URL("./data/workspace-store.json", import.meta.url);

const STATIC_CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function json(value, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(value),
  };
}

class ValidationError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedWorkspace() {
  return {
    ...clone(defaultWorkspace),
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function readLegacyWorkspace() {
  try {
    await access(legacyWorkspacePath);
    const raw = await readFile(legacyWorkspacePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return seedWorkspace();
  }
}

async function initializeDatabase() {
  await mkdir(dataDir, { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workspace_drafts (
      draft_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workspace_revisions (
      revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      saved_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS application_submissions (
      submission_id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL,
      submission_payload TEXT NOT NULL,
      orchestration_result TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );
  `);

  const existingDraft = database
    .prepare("SELECT draft_id FROM workspace_drafts WHERE draft_id = ?")
    .get(PRIMARY_DRAFT_ID);

  if (!existingDraft) {
    const initialWorkspace = await readLegacyWorkspace();
    const timestamp = initialWorkspace.lastUpdatedAt ?? new Date().toISOString();
    const payload = JSON.stringify({
      ...initialWorkspace,
      lastUpdatedAt: timestamp,
    });

    database
      .prepare(`
        INSERT INTO workspace_drafts (draft_id, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(PRIMARY_DRAFT_ID, payload, timestamp, timestamp);

    database
      .prepare(`
        INSERT INTO workspace_revisions (draft_id, payload, saved_at)
        VALUES (?, ?, ?)
      `)
      .run(PRIMARY_DRAFT_ID, payload, timestamp);
  }

  return database;
}

const db = await initializeDatabase();

function readWorkspace() {
  const row = db
    .prepare("SELECT payload FROM workspace_drafts WHERE draft_id = ?")
    .get(PRIMARY_DRAFT_ID);

  if (!row) {
    throw new Error("Workspace draft not found.");
  }

  return JSON.parse(row.payload);
}

function saveWorkspace(workspace) {
  const timestamp = new Date().toISOString();
  const nextWorkspace = {
    ...workspace,
    lastUpdatedAt: timestamp,
  };
  const payload = JSON.stringify(nextWorkspace);

  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(`
      INSERT INTO workspace_drafts (draft_id, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(draft_id) DO UPDATE SET
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).run(PRIMARY_DRAFT_ID, payload, timestamp, timestamp);

    db.prepare(`
      INSERT INTO workspace_revisions (draft_id, payload, saved_at)
      VALUES (?, ?, ?)
    `).run(PRIMARY_DRAFT_ID, payload, timestamp);

    db.exec("COMMIT");
    return nextWorkspace;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function recordSubmission(submissionId, workspace, orchestrationResult) {
  db.prepare(`
    INSERT INTO application_submissions (
      submission_id,
      draft_id,
      submission_payload,
      orchestration_result,
      submitted_at
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    submissionId,
    PRIMARY_DRAFT_ID,
    JSON.stringify(workspace),
    JSON.stringify(orchestrationResult),
    orchestrationResult.submission.submittedAt,
  );
}

async function submitWorkspace(workspace) {
  const issues = collectSubmissionIssues(workspace);

  if (issues.length) {
    throw new ValidationError(
      "The application is incomplete or contains invalid data.",
      issues,
    );
  }

  const orchestrationResult = await orchestrateApplicationSubmission(workspace);
  const nextWorkspace = saveWorkspace({
    ...workspace,
    submission: orchestrationResult.submission,
    orchestration: orchestrationResult.orchestration,
  });

  recordSubmission(
    orchestrationResult.submission.referenceId,
    nextWorkspace,
    orchestrationResult,
  );

  return nextWorkspace;
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => resolve(raw));
    request.on("error", reject);
  });
}

async function serveKycFabricAsset(pathname, response) {
  const routePath = pathname.replace(/^\/kyc-fabric\/?/, "");
  const isAssetRequest = routePath.startsWith("assets/");
  const relativePath = isAssetRequest && routePath ? routePath : "index.html";

  if (relativePath.includes("..")) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return true;
  }

  const assetPath = path.join(kycFabricDistDir, relativePath);

  try {
    const body = await readFile(assetPath);
    const extension = path.extname(assetPath).toLowerCase();
    response.writeHead(200, {
      "Content-Type":
        STATIC_CONTENT_TYPES[extension] ?? "application/octet-stream",
      "Cache-Control": isAssetRequest ? "public, max-age=31536000, immutable" : "no-cache",
    });
    response.end(body);
    return true;
  } catch {
    if (!isAssetRequest) {
      try {
        const indexHtml = await readFile(path.join(kycFabricDistDir, "index.html"));
        response.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
        });
        response.end(indexHtml);
        return true;
      } catch {
        const result = json(
          { error: "KYC Fabric bundle is not built yet." },
          503,
        );
        response.writeHead(result.statusCode, result.headers);
        response.end(result.body);
        return true;
      }
    }

    return false;
  }
}

const server = createServer(async (request, response) => {
  try {
    if (!request.url) {
      const result = json({ error: "Missing request URL." }, 400);
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/kyc-fabric")) {
      const handled = await serveKycFabricAsset(url.pathname, response);

      if (handled) {
        return;
      }
    }

    if (request.method === "GET" && url.pathname === "/api/account-opening/health") {
      const result = json({
        status: "ok",
        service: "commercial-account-opening-node-api",
        storage: "sqlite",
      });
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/account-opening/workspace") {
      const result = json(readWorkspace());
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/account-opening/workspace") {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(saveWorkspace(workspace));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/account-opening/submit") {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(await submitWorkspace(workspace));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/check-kyc/applications"
    ) {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(await submitCheckKycApplication(workspace));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/check-risk/applications"
    ) {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(await submitCheckRiskApplication(workspace));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    const result = json({ error: "Route not found." }, 404);
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  } catch (error) {
    const result =
      error instanceof SyntaxError
        ? json({ error: "Invalid JSON payload." }, 500)
        : error instanceof ValidationError
          ? json({ error: error.message, issues: error.issues }, 400)
          : error instanceof KycFailedError
            ? (() => {
                const message = String(error.message ?? "KYC Failed.");
                const normalizedMessage = message.startsWith("KYC Failed")
                  ? message
                  : `KYC Failed: ${message}`;

                return json(
                  {
                    error: normalizedMessage,
                    issues: [
                      {
                        fieldKey: "submission",
                        message: normalizedMessage,
                      },
                    ],
                    integration: error.integration,
                  },
                  400,
                );
              })()
          : json({ error: "Unexpected server error." }, 500);
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  }
});

server.listen(PORT, () => {
  console.log(`Node API listening on http://localhost:${PORT}`);
});
