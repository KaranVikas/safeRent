// Single place for all backend calls.
// In dev, VITE_API_BASE is empty and Vite proxies /api → localhost:8000.
const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // anonymous session cookie must travel
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || `API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => request("/api/health/"),

  // bbox: [minLng, minLat, maxLng, maxLat]
  buildings: (bbox) =>
    request(`/api/buildings/?bbox=${bbox.map((n) => n.toFixed(5)).join(",")}`),

  buildingDetail: (id) => request(`/api/buildings/${id}/`),

  createComplaint: (payload) =>
    request("/api/complaints/", { method: "POST", body: JSON.stringify(payload) }),

  confirmComplaint: (id) =>
    request(`/api/complaints/${id}/confirm/`, { method: "POST" }),

  flagComplaint: (id, reason) =>
    request(`/api/complaints/${id}/flag/`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// Shared issue-type metadata (labels + pin/marker colors).
export const ISSUE_TYPES = {
  mold: { label: "Mold / dampness", color: "#5A7D5A" },
  pests: { label: "Pests", color: "#8B5A2B" },
  heat: { label: "No / inadequate heat", color: "#B5482A" },
  water: { label: "Water / plumbing", color: "#3E5C76" },
  repairs: { label: "Repairs not done", color: "#7A6A53" },
  safety: { label: "Safety", color: "#A12D2D" },
  other: { label: "Other", color: "#6B7280" },
};
