import { access, mkdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { submitCheckRiskApplication } from "./checkRiskApi.js";
import {
  processCheckKycRequest,
  submitCheckKycApplication,
} from "./checkKycApi.js";
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

function normalizeDraftId(candidate) {
  const normalized = String(candidate ?? "").trim();

  if (!normalized) {
    return "";
  }

  return normalized.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function getDraftIdFromUrl(url) {
  return normalizeDraftId(url.searchParams.get("draft"));
}

function ensureWorkspaceMetadata(workspace, draftId) {
  return {
    ...workspace,
    draftId,
  };
}

function normalizeEntityToken(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveEntityKey(workspace = {}) {
  const legalName = normalizeEntityToken(workspace.companyInfo?.legalName);
  const taxId = String(workspace.companyInfo?.taxId ?? "").replace(/\D/g, "");

  if (!legalName || !taxId) {
    return "";
  }

  return `${legalName}-${taxId}`;
}

function buildDraftSummary(workspace = {}, updatedAt) {
  const legalName = String(workspace.companyInfo?.legalName ?? "").trim();
  const taxId = String(workspace.companyInfo?.taxId ?? "").trim();
  const entityLabel =
    legalName && taxId
      ? `${legalName} (${taxId})`
      : legalName || taxId || "Untitled entity";

  return {
    draftId: workspace.draftId ?? null,
    entityKey: deriveEntityKey(workspace),
    entityLabel,
    legalName,
    taxId,
    status: workspace.submission?.status === "submitted" ? "submitted" : "draft",
    updatedAt: updatedAt ?? workspace.lastUpdatedAt ?? null,
    retrievalUrl: workspace.draftId ? `/?draft=${workspace.draftId}` : "",
  };
}

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
    draftId: PRIMARY_DRAFT_ID,
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
      entity_key TEXT,
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
  const workspaceDraftColumns = database
    .prepare("PRAGMA table_info(workspace_drafts)")
    .all();

  if (!workspaceDraftColumns.some((column) => column.name === "entity_key")) {
    database.exec("ALTER TABLE workspace_drafts ADD COLUMN entity_key TEXT");
  }

  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS workspace_drafts_entity_key_unique
    ON workspace_drafts(entity_key)
    WHERE entity_key IS NOT NULL AND entity_key <> '';
  `);

  const existingDraft = database
    .prepare("SELECT draft_id FROM workspace_drafts WHERE draft_id = ?")
    .get(PRIMARY_DRAFT_ID);

  if (!existingDraft) {
    const initialWorkspace = await readLegacyWorkspace();
    const timestamp = initialWorkspace.lastUpdatedAt ?? new Date().toISOString();
    const payload = JSON.stringify(
      ensureWorkspaceMetadata(
        {
          ...initialWorkspace,
          lastUpdatedAt: timestamp,
        },
        PRIMARY_DRAFT_ID,
      ),
    );

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

  const draftsMissingEntityKey = database
    .prepare(`
      SELECT draft_id, payload
      FROM workspace_drafts
      WHERE entity_key IS NULL OR entity_key = ''
    `)
    .all();

  const updateEntityKeyStatement = database.prepare(`
    UPDATE workspace_drafts
    SET entity_key = ?
    WHERE draft_id = ?
  `);

  draftsMissingEntityKey.forEach((row) => {
    const workspace = JSON.parse(row.payload);
    const entityKey = deriveEntityKey(workspace);

    if (entityKey) {
      updateEntityKeyStatement.run(entityKey, row.draft_id);
    }
  });

  return database;
}

const db = await initializeDatabase();

function readWorkspace(draftId = PRIMARY_DRAFT_ID) {
  const row = db
    .prepare("SELECT payload FROM workspace_drafts WHERE draft_id = ?")
    .get(draftId);

  if (!row) {
    throw new Error("Workspace draft not found.");
  }

  return ensureWorkspaceMetadata(JSON.parse(row.payload), draftId);
}

function listDrafts() {
  const rows = db
    .prepare(`
      SELECT draft_id, payload, updated_at
      FROM workspace_drafts
      ORDER BY datetime(updated_at) DESC
    `)
    .all();

  return rows
    .map((row) => {
      const workspace = ensureWorkspaceMetadata(JSON.parse(row.payload), row.draft_id);
      return buildDraftSummary(workspace, row.updated_at);
    })
    .filter((draft) => draft.status === "draft");
}

function saveWorkspace(workspace, requestedDraftId = "") {
  const timestamp = new Date().toISOString();
  const entityKey = deriveEntityKey(workspace);
  const existingDraftForEntity =
    entityKey
      ? db
          .prepare(`
            SELECT draft_id
            FROM workspace_drafts
            WHERE entity_key = ?
          `)
          .get(entityKey)
      : null;
  const draftId =
    existingDraftForEntity?.draft_id ||
    normalizeDraftId(requestedDraftId) ||
    normalizeDraftId(workspace?.draftId) ||
    randomUUID();
  const nextWorkspace = {
    ...ensureWorkspaceMetadata(workspace, draftId),
    lastUpdatedAt: timestamp,
  };
  const payload = JSON.stringify(nextWorkspace);

  db.exec("BEGIN IMMEDIATE");

  try {
    db.prepare(`
      INSERT INTO workspace_drafts (draft_id, entity_key, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(draft_id) DO UPDATE SET
        entity_key = excluded.entity_key,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `).run(draftId, entityKey || null, payload, timestamp, timestamp);

    db.prepare(`
      INSERT INTO workspace_revisions (draft_id, payload, saved_at)
      VALUES (?, ?, ?)
    `).run(draftId, payload, timestamp);

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
    workspace.draftId,
    JSON.stringify(workspace),
    JSON.stringify(orchestrationResult),
    orchestrationResult.submission.submittedAt,
  );
}

async function submitWorkspace(workspace, requestedDraftId = "") {
  const issues = collectSubmissionIssues(workspace);

  if (issues.length) {
    throw new ValidationError(
      "The application is incomplete or contains invalid data.",
      issues,
    );
  }

  const orchestrationResult = await orchestrateApplicationSubmission(workspace);
  const nextWorkspace = saveWorkspace(
    {
      ...workspace,
      submission: orchestrationResult.submission,
      orchestration: orchestrationResult.orchestration,
    },
    requestedDraftId,
  );

  recordSubmission(
    orchestrationResult.submission.referenceId,
    nextWorkspace,
    orchestrationResult,
  );

  return nextWorkspace;
}

function workspaceNotFoundResult(draftId) {
  return json(
    {
      error: `Workspace draft "${draftId}" was not found.`,
      code: "draft_not_found",
    },
    404,
  );
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseRevenue(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

function mapCountryToRegion(country) {
  const normalizedCountry = String(country ?? "").trim().toLowerCase();

  if (["united states", "canada", "mexico"].includes(normalizedCountry)) {
    return "North America";
  }

  if (["united kingdom", "germany", "switzerland"].includes(normalizedCountry)) {
    return "Europe";
  }

  if (["singapore"].includes(normalizedCountry)) {
    return "Asia Pacific";
  }

  return "North America";
}

function mapCountryToCoordinates(country) {
  const normalizedCountry = String(country ?? "").trim().toLowerCase();

  switch (normalizedCountry) {
    case "united kingdom":
      return [-0.1276, 51.5072];
    case "germany":
      return [13.405, 52.52];
    case "singapore":
      return [103.8198, 1.3521];
    case "canada":
      return [-79.3832, 43.6532];
    case "mexico":
      return [-99.1332, 19.4326];
    default:
      return [-74.006, 40.7128];
  }
}

function mapDecisionToPriority(overallDecision) {
  switch (overallDecision) {
    case "manual_review":
      return "high";
    case "enhanced_review":
      return "medium";
    default:
      return "low";
  }
}

function mapDecisionToStage(overallDecision) {
  switch (overallDecision) {
    case "manual_review":
      return "advisor-review";
    case "enhanced_review":
      return "quality-check";
    default:
      return "quality-check";
  }
}

function mapDecisionToStatus(overallDecision) {
  switch (overallDecision) {
    case "manual_review":
      return "exception";
    default:
      return "in-flight";
  }
}

function mapCheckDecisionToRuleStatus(decision) {
  switch (decision) {
    case "escalate":
    case "high":
    case "failed":
    case "follow_up_required":
      return "failed";
    case "review":
    case "moderate":
      return "manual-review";
    default:
      return "passed";
  }
}

function buildSubmittedClientId(workspace, submissionId) {
  const entityKey = deriveEntityKey(workspace);
  return `client-${entityKey || slugify(submissionId)}`;
}

function buildSubmittedCaseId(submissionId) {
  return `case-${slugify(submissionId)}`;
}

function buildSubmittedClientRecord(workspace, submissionId) {
  const country = workspace.companyInfo?.incorporationCountry || workspace.addresses?.country;
  const region = mapCountryToRegion(country);
  const coordinates = mapCountryToCoordinates(country);

  return {
    id: buildSubmittedClientId(workspace, submissionId),
    name: workspace.companyInfo?.legalName || submissionId,
    segment: "Corporate",
    headquarters:
      workspace.addresses?.city && workspace.addresses?.state
        ? `${workspace.addresses.city}, ${workspace.addresses.state}`
        : workspace.addresses?.city || workspace.addresses?.country || "Unknown",
    region,
    coordinates,
    sector: workspace.companyInfo?.industry || "Corporate Services",
    annualRevenueUsd: parseRevenue(workspace.companyInfo?.annualRevenue),
  };
}

function buildSubmittedDocuments(workspace, submittedAt) {
  return (workspace.documentOptions ?? [])
    .filter((document) => workspace.documents?.[document.key])
    .map((document, index) => {
      const file = workspace.documentFiles?.[document.key];

      return {
        id: `doc-${slugify(document.key)}-${index + 1}`,
        type: document.title,
        status: file ? "validated" : "flagged",
        completeness: file ? 100 : 45,
        uploadedAt: file?.uploadedAt ?? submittedAt,
        extractedFields: [document.key.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`)],
      };
    });
}

function buildSubmittedQcRules(orchestration = {}) {
  const checks = Object.values(orchestration.checks ?? {});

  return checks.map((check, index) => ({
    id: `rule-${slugify(check.key || check.label || String(index + 1))}`,
    label: check.label || check.key || `Check ${index + 1}`,
    status: mapCheckDecisionToRuleStatus(check.decision),
    rationale: check.summary || "Automated review completed.",
  }));
}

function buildSubmittedOwnershipGraph(workspace, caseId) {
  const clientNodeId = `${caseId}-client`;
  const jurisdictionNodeId = `${caseId}-jurisdiction`;
  const advisorNodeId = `${caseId}-advisor`;
  const ownerNodes = (workspace.beneficialOwners ?? []).map((owner, index) => ({
    id: owner.id || `${caseId}-owner-${index + 1}`,
    name: owner.fullName || `Owner ${index + 1}`,
    role: owner.title || "Beneficial Owner",
    group: "beneficial-owner",
  }));

  return {
    nodes: [
      {
        id: clientNodeId,
        name: workspace.companyInfo?.legalName || "Submitted entity",
        role: "Client",
        group: "client",
      },
      ...ownerNodes,
      {
        id: advisorNodeId,
        name: workspace.primaryContact?.fullName || "Onboarding contact",
        role: workspace.primaryContact?.title || "Advisor",
        group: "advisor",
      },
      {
        id: jurisdictionNodeId,
        name: workspace.companyInfo?.incorporationCountry || workspace.addresses?.country || "Jurisdiction",
        role: "Jurisdiction",
        group: "jurisdiction",
      },
    ],
    links: [
      ...ownerNodes.map((owner, index) => ({
        source: clientNodeId,
        target: owner.id,
        weight:
          Number.parseInt(
            String(workspace.beneficialOwners?.[index]?.ownershipPercentage ?? "").replace(/\D/g, ""),
            10,
          ) || 25,
      })),
      {
        source: advisorNodeId,
        target: clientNodeId,
        weight: 50,
      },
      {
        source: jurisdictionNodeId,
        target: clientNodeId,
        weight: 60,
      },
    ],
  };
}

function buildSubmittedTimelineEvents(caseRecord, workspace, orchestrationResult, clientRecord) {
  const submittedAt = orchestrationResult.submission?.submittedAt || new Date().toISOString();
  const caseId = caseRecord.id;
  const clientId = clientRecord.id;
  const overallDecision = orchestrationResult.submission?.overallDecision;
  const baseTimestamp = Date.parse(submittedAt);
  const documentCount = caseRecord.documents.length;
  const timeline = [
    {
      id: `${caseId}-timeline-1`,
      timeOffsetMs: 0,
      timestamp: submittedAt,
      type: "document_uploaded",
      title: "Application package submitted",
      description: `${documentCount || "Core"} onboarding document${documentCount === 1 ? "" : "s"} arrived with the corporate account opening application.`,
      severity: "info",
      caseId,
      clientId,
      routeHint: "cases",
    },
    {
      id: `${caseId}-timeline-2`,
      timeOffsetMs: 45_000,
      timestamp: new Date(baseTimestamp + 45_000).toISOString(),
      type: "agent_classified",
      title: "Automated onboarding review completed",
      description: orchestrationResult.orchestration?.summary || "KYC, AML, document, and risk reviews completed.",
      severity: overallDecision === "ready_for_bank_review" ? "success" : "info",
      caseId,
      clientId,
      routeHint: "agents",
    },
  ];

  if (overallDecision !== "ready_for_bank_review") {
    timeline.push({
      id: `${caseId}-timeline-3`,
      timeOffsetMs: 90_000,
      timestamp: new Date(baseTimestamp + 90_000).toISOString(),
      type: "qc_failed",
      title:
        overallDecision === "manual_review"
          ? "Case routed to manual review"
          : "Follow-up review queued",
      description:
        orchestrationResult.submission?.recommendedAction ||
        "Analyst follow-up is required before the case can progress.",
      severity: overallDecision === "manual_review" ? "warning" : "info",
      caseId,
      clientId,
      routeHint: "cases",
    });
  }

  return timeline;
}

function buildSubmittedActivityFeed(caseRecord, orchestrationResult) {
  const submittedAt = orchestrationResult.submission?.submittedAt || new Date().toISOString();
  const completedAt = orchestrationResult.orchestration?.completedAt || submittedAt;
  const overallDecision = orchestrationResult.submission?.overallDecision;

  return [
    {
      id: `${caseRecord.id}-activity-1`,
      title: "Corporate application submitted",
      description: `${caseRecord.caseName} was submitted from Corporate Account Opening and opened in KYC-Fabric.`,
      timestamp: submittedAt,
      severity: "info",
      routeHint: "executive",
    },
    {
      id: `${caseRecord.id}-activity-2`,
      title:
        overallDecision === "manual_review"
          ? "Manual review required"
          : overallDecision === "enhanced_review"
            ? "Enhanced review queued"
            : "Ready for bank review",
      description:
        orchestrationResult.submission?.summary ||
        "The submitted case completed automated onboarding review.",
      timestamp: completedAt,
      severity: overallDecision === "manual_review" ? "warning" : "success",
      routeHint: "cases",
    },
  ];
}

function buildSubmittedCaseRecord(workspace, orchestrationResult) {
  const submissionId = orchestrationResult.submission?.referenceId || randomUUID();
  const clientRecord = buildSubmittedClientRecord(workspace, submissionId);
  const documents = buildSubmittedDocuments(
    workspace,
    orchestrationResult.submission?.submittedAt || new Date().toISOString(),
  );
  const qcRules = buildSubmittedQcRules(orchestrationResult.orchestration);
  const overallDecision = orchestrationResult.submission?.overallDecision;
  const caseId = buildSubmittedCaseId(submissionId);
  const riskScore =
    orchestrationResult.orchestration?.checks?.risk?.score ??
    (overallDecision === "manual_review"
      ? 72
      : overallDecision === "enhanced_review"
        ? 56
        : 38);

  const caseRecord = {
    id: caseId,
    clientId: clientRecord.id,
    caseName: `${workspace.companyInfo?.legalName || "Corporate Application"} ${submissionId}`,
    priority: mapDecisionToPriority(overallDecision),
    stage: mapDecisionToStage(overallDecision),
    status: mapDecisionToStatus(overallDecision),
    jurisdiction:
      workspace.companyInfo?.incorporationCountry ||
      workspace.addresses?.country ||
      "United States",
    region: clientRecord.region,
    riskScore,
    stpEligible: overallDecision === "ready_for_bank_review",
    firstTimeRight: overallDecision === "ready_for_bank_review",
    onboardingHours:
      overallDecision === "manual_review"
        ? 30.5
        : overallDecision === "enhanced_review"
          ? 21.5
          : 14.2,
    assignedTo:
      overallDecision === "manual_review"
        ? "Onboarding Specialist"
        : overallDecision === "enhanced_review"
          ? "Compliance Analyst"
          : "Bank Review Queue",
    completeness: Math.min(
      100,
      52 +
        documents.length * 8 +
        (workspace.declarations?.confirmTerms ? 8 : 0) +
        (workspace.beneficialOwners?.length ?? 0) * 2,
    ),
    documents,
    qcRules,
    narrative:
      orchestrationResult.submission?.summary ||
      "A corporate account opening application was submitted into KYC-Fabric.",
    nextBestAction:
      orchestrationResult.submission?.recommendedAction ||
      "Review the submitted onboarding package.",
    ownershipGraph: buildSubmittedOwnershipGraph(workspace, caseId),
  };

  return {
    clients: [clientRecord],
    cases: [caseRecord],
    timeline: buildSubmittedTimelineEvents(
      caseRecord,
      workspace,
      orchestrationResult,
      clientRecord,
    ),
    activityFeed: buildSubmittedActivityFeed(caseRecord, orchestrationResult),
    alerts: [],
    decisionLogs: [],
  };
}

function buildAccountOpeningPlatformSnapshot() {
  const rows = db
    .prepare(`
      SELECT submission_id, submission_payload, orchestration_result, submitted_at
      FROM application_submissions
      ORDER BY datetime(submitted_at) DESC
    `)
    .all();

  const aggregated = {
    clients: [],
    cases: [],
    timeline: [],
    activityFeed: [],
    alerts: [],
    decisionLogs: [],
  };

  rows.forEach((row) => {
    const workspace = JSON.parse(row.submission_payload);
    const orchestrationResult = JSON.parse(row.orchestration_result);
    const snapshot = buildSubmittedCaseRecord(workspace, orchestrationResult);

    aggregated.clients.push(...snapshot.clients);
    aggregated.cases.push(...snapshot.cases);
    aggregated.timeline.push(...snapshot.timeline);
    aggregated.activityFeed.push(...snapshot.activityFeed);
  });

  return aggregated;
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
      const draftId = getDraftIdFromUrl(url) || PRIMARY_DRAFT_ID;
      let result;

      try {
        result = json(readWorkspace(draftId));
      } catch (error) {
        if (draftId !== PRIMARY_DRAFT_ID && error?.message === "Workspace draft not found.") {
          result = workspaceNotFoundResult(draftId);
        } else {
          throw error;
        }
      }

      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/account-opening/drafts") {
      const result = json({ drafts: listDrafts() });
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/account-opening/platform-snapshot"
    ) {
      const result = json(buildAccountOpeningPlatformSnapshot());
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/account-opening/workspace") {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(saveWorkspace(workspace, getDraftIdFromUrl(url)));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/account-opening/submit") {
      const rawBody = await readRequestBody(request);
      const workspace = JSON.parse(rawBody);
      const result = json(await submitWorkspace(workspace, getDraftIdFromUrl(url)));
      response.writeHead(result.statusCode, result.headers);
      response.end(result.body);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/checkKYC") {
      const rawBody = await readRequestBody(request);
      const checkKycRequest = JSON.parse(rawBody);
      const result = json(await processCheckKycRequest(checkKycRequest));
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
