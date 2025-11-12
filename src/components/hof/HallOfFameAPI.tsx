// src/api.ts
import type { School, HofCard, PersonDetails } from "./types";

function normalizeBase(v: string) {
  return v.trim().replace(/\/+$/, "");
}

// --- figure out API base ---
let API_BASE = "";
try {
  const raw = (import.meta.env.VITE_API_BASE ?? "").toString();
  API_BASE = normalizeBase(raw);
} catch {
  API_BASE = "";
}

// Fallback for local dev: if you're on Vite dev port and no env set, default to :8080
if (!API_BASE && typeof window !== "undefined") {
  const h = window.location.host;
  if (h.includes("localhost:5173") || h.includes("127.0.0.1:5173")) {
    API_BASE = "http://localhost:8080";
  }
}

console.log("[api] BASE =", API_BASE || "(relative)");

// --- tiny helpers ---
function toQS(params: Record<string, string | number | boolean | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  return qs.toString();
}

async function jsonFetch(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
) {
  const { timeoutMs = 15000, ...req } = init ?? {};
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...req,
      headers: { Accept: "application/json", ...(req?.headers ?? {}) },
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}\n${text.slice(0, 400)}`);
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      // Helpful hint if you’re hitting Vite instead of the API
      if (ct.includes("text/html") && url.includes(":5173")) {
        throw new Error(
          `Got HTML from ${url} (likely Vite dev server). Configure VITE_API_BASE or a Vite proxy.\n` +
          text.slice(0, 200)
        );
      }
      throw new Error(`Non-JSON response (${ct}) for ${url}\n${text.slice(0, 400)}`);
    }

    return res.json();
  } finally {
    clearTimeout(id);
  }
}

// --- public API ---
export async function fetchSchools(): Promise<School[]> {
  return jsonFetch(`${API_BASE}/api/schools`);
}

export async function fetchHof(params: {
  category: string;
  school?: string;          // omit when "all"
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<HofCard[]> {
  const qs = toQS({
    category: params.category,
    school: params.school,
    featuredOnly: params.featuredOnly ? "true" : undefined,
    limit: params.limit,
    offset: params.offset,
  });
  return jsonFetch(`${API_BASE}/api/hof?${qs}`);
}

export async function fetchPerson(id: number): Promise<PersonDetails> {
  return jsonFetch(`${API_BASE}/api/person/${id}`);
}
