const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

const DATABASE_AGENT_PATHS = {
  tables: [
    `${API_BASE}/account-opening/workspace?resource=tables`,
    `${API_BASE}/account-opening/tables`,
    `${API_BASE}/agents/database/tables`,
    `${API_BASE}/account-opening/agents/database/tables`,
  ],
  schema: [
    `${API_BASE}/account-opening/workspace?resource=table-schema`,
    `${API_BASE}/account-opening/table-schema`,
    `${API_BASE}/agents/database/schema`,
    `${API_BASE}/account-opening/agents/database/schema`,
  ],
  insert: [
    `${API_BASE}/account-opening/workspace?resource=table-insert`,
    `${API_BASE}/account-opening/table-insert`,
    `${API_BASE}/agents/database/insert`,
    `${API_BASE}/account-opening/agents/database/insert`,
  ],
};

function withDraftId(path, draftId) {
  if (!draftId) {
    return `${API_BASE}${path}`;
  }

  const params = new URLSearchParams({ draft: draftId });
  return `${API_BASE}${path}?${params.toString()}`;
}

async function readJson(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      payload?.error ?? `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function shouldRetryOnAlternatePath(error) {
  const message = String(error?.message ?? "").toLowerCase();
  return error?.status === 404 || message.includes("route not found");
}

function createUnexpectedPayloadError(message, payload) {
  const error = new Error(message);
  error.name = "UnexpectedApiPayloadError";
  error.payload = payload;
  return error;
}

async function requestJsonWithFallback(paths, init, isValidPayload = () => true) {
  let lastError = null;
  let preferredError = null;

  for (let index = 0; index < paths.length; index += 1) {
    try {
      const response = await fetch(paths[index], init);
      const payload = await readJson(response);

      if (!isValidPayload(payload)) {
        throw createUnexpectedPayloadError(
          `Unexpected payload received from ${paths[index]}.`,
          payload,
        );
      }

      return payload;
    } catch (error) {
      lastError = error;

      if (error?.name === "UnexpectedApiPayloadError") {
        preferredError = error;
      }

      if (
        (!shouldRetryOnAlternatePath(error) &&
          error?.name !== "UnexpectedApiPayloadError") ||
        index === paths.length - 1
      ) {
        throw preferredError ?? error;
      }
    }
  }

  throw preferredError ?? lastError ?? new Error("Request failed.");
}

function deriveFallbackKycStatus(submittedCase = {}) {
  const status = String(submittedCase.status ?? "").trim().toLowerCase();
  const priority = String(submittedCase.priority ?? "").trim().toLowerCase();

  if (status === "exception" || priority === "high") {
    return "review";
  }

  return "clear";
}

function unwrapSnapshotPayload(snapshot = {}) {
  if (snapshot?.snapshot) {
    return unwrapSnapshotPayload(snapshot.snapshot);
  }

  if (snapshot?.data) {
    return unwrapSnapshotPayload(snapshot.data);
  }

  return snapshot;
}

function mapSnapshotToSubmissions(snapshot = {}) {
  const unwrappedSnapshot = unwrapSnapshotPayload(snapshot);
  const cases = Array.isArray(unwrappedSnapshot.cases) ? unwrappedSnapshot.cases : [];

  return cases.map((submittedCase) => ({
    submissionId: submittedCase.caseName?.match(/(SUB-[A-Z0-9-]+)/i)?.[1] ?? submittedCase.id,
    draftId: null,
    entityKey: "",
    entityLabel: submittedCase.caseName ?? "Submitted application",
    legalName: submittedCase.intakeForm?.companyInfo?.legalName ?? "",
    taxId: submittedCase.intakeForm?.companyInfo?.taxId ?? "",
    submittedAt:
      submittedCase.timeline?.submittedAt ??
      submittedCase.documents?.[0]?.uploadedAt ??
      null,
    overallDecision:
      submittedCase.priority === "high"
        ? "manual_review"
        : submittedCase.priority === "medium"
          ? "enhanced_review"
          : "ready_for_bank_review",
    kycStatus: deriveFallbackKycStatus(submittedCase),
    kycSummary:
      submittedCase.narrative ??
      "KYC review details are available from the submitted onboarding case.",
    recommendedAction: submittedCase.nextBestAction ?? "",
    retrievalUrl: "",
  }));
}

function mapWorkspaceToSubmission(workspace = {}) {
  const legalName = String(workspace.companyInfo?.legalName ?? "").trim();
  const taxId = String(workspace.companyInfo?.taxId ?? "").trim();
  const entityLabel =
    legalName && taxId
      ? `${legalName} (${taxId})`
      : legalName || taxId || "Submitted application";
  const kycCheck = workspace.orchestration?.checks?.kyc ?? null;

  return {
    submissionId: workspace.submission?.referenceId ?? workspace.draftId ?? "current-submission",
    draftId: workspace.draftId ?? null,
    entityKey: "",
    entityLabel,
    legalName,
    taxId,
    submittedAt: workspace.submission?.submittedAt ?? workspace.lastUpdatedAt ?? null,
    overallDecision: workspace.submission?.overallDecision ?? "pending",
    kycStatus: kycCheck?.decision ?? kycCheck?.status ?? "pending",
    kycSummary:
      kycCheck?.summary ??
      workspace.submission?.summary ??
      "KYC review is pending.",
    recommendedAction:
      workspace.submission?.recommendedAction ??
      workspace.orchestration?.summary ??
      "",
    retrievalUrl: workspace.draftId ? `/?draft=${workspace.draftId}` : "",
  };
}

export async function loadWorkspace(draftId) {
  const response = await fetch(withDraftId("/account-opening/workspace", draftId));
  return readJson(response);
}

export async function listWorkspaceDrafts() {
  const response = await fetch(`${API_BASE}/account-opening/drafts`);
  return readJson(response);
}

export async function listSubmittedApplications() {
  try {
    const response = await fetch(`${API_BASE}/account-opening/submissions`);
    const payload = await readJson(response);

    if (Array.isArray(payload?.submissions) && payload.submissions.length > 0) {
      return payload;
    }
  } catch {
    // Fall through to fallback sources.
  }

  for (const fallbackPath of [
    "/account-opening/platform-snapshot",
    "/platform/snapshot",
  ]) {
    try {
      const fallbackResponse = await fetch(`${API_BASE}${fallbackPath}`);
      const snapshot = await readJson(fallbackResponse);
      const submissions = mapSnapshotToSubmissions(snapshot);

      if (submissions.length) {
        return { submissions };
      }
    } catch {
      // Continue to the next fallback source.
    }
  }

  try {
    const workspaceResponse = await fetch(`${API_BASE}/account-opening/workspace`);
    const workspace = await readJson(workspaceResponse);

    return {
      submissions:
        workspace?.submission?.status === "submitted"
          ? [mapWorkspaceToSubmission(workspace)]
          : [],
    };
  } catch {
    throw new Error("Submitted applications are unavailable.");
  }
}

export async function saveWorkspace(workspace, draftId = workspace?.draftId) {
  const response = await fetch(withDraftId("/account-opening/workspace", draftId), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  });

  return readJson(response);
}

export async function submitWorkspace(workspace, draftId = workspace?.draftId) {
  const response = await fetch(withDraftId("/account-opening/submit", draftId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  });

  return readJson(response);
}

export async function listDatabaseTables() {
  return requestJsonWithFallback(
    DATABASE_AGENT_PATHS.tables,
    undefined,
    (payload) => Array.isArray(payload?.tables),
  );
}

export async function describeDatabaseTable(tableName) {
  const params = new URLSearchParams({ tableName: String(tableName ?? "") });
  return requestJsonWithFallback(
    DATABASE_AGENT_PATHS.schema.map((path) =>
      path.includes("?")
        ? `${path}&${params.toString()}`
        : `${path}?${params.toString()}`,
    ),
    undefined,
    (payload) => Array.isArray(payload?.columns),
  );
}

export async function insertDatabaseRow(tableName, data) {
  return requestJsonWithFallback(
    DATABASE_AGENT_PATHS.insert,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tableName,
        data,
      }),
    },
    (payload) => payload?.inserted === true,
  );
}
