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

export async function loadWorkspace(draftId) {
  const response = await fetch(withDraftId("/account-opening/workspace", draftId));
  return readJson(response);
}

export async function listWorkspaceDrafts() {
  const response = await fetch(`${API_BASE}/account-opening/drafts`);
  return readJson(response);
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
