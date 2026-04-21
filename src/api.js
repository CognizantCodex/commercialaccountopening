const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

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

function deriveFallbackKycStatus(submittedCase = {}) {
  const status = String(submittedCase.status ?? "").trim().toLowerCase();
  const priority = String(submittedCase.priority ?? "").trim().toLowerCase();

  if (status === "exception" || priority === "high") {
    return "review";
  }

  return "clear";
}

function mapSnapshotToSubmissions(snapshot = {}) {
  const cases = Array.isArray(snapshot.cases) ? snapshot.cases : [];

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
    return await readJson(response);
  } catch {
    const fallbackResponse = await fetch(`${API_BASE}/account-opening/platform-snapshot`);
    const snapshot = await readJson(fallbackResponse);

    return {
      submissions: mapSnapshotToSubmissions(snapshot),
    };
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
