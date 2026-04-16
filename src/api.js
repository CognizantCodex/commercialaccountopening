const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function readJson(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
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
