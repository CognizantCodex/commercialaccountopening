const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

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

export async function loadWorkspace() {
  const response = await fetch(`${API_BASE}/account-opening/workspace`);
  return readJson(response);
}

export async function saveWorkspace(workspace) {
  const response = await fetch(`${API_BASE}/account-opening/workspace`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  });

  return readJson(response);
}

export async function submitWorkspace(workspace) {
  const response = await fetch(`${API_BASE}/account-opening/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workspace),
  });

  return readJson(response);
}
