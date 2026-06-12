// Single place for all backend calls.
// In dev, VITE_API_BASE is empty and Vite proxies /api → localhost:8000.
// In production, set VITE_API_BASE to the Render URL.
const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include", // anonymous session cookie must travel
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health/"),
  // Day 3+: complaints, buildings, confirmations endpoints land here.
};
