import { projectId, publicAnonKey } from "/utils/supabase/info";
import type {
  Itinerary,
  ItineraryMeta,
  CreateItineraryInput,
} from "../types/itinerary";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-7f429b55`;
const H = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
};

/** fetch with a per-attempt timeout + exponential-backoff retry */
async function req<T>(url: string, opts?: RequestInit, retries = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8s timeout
    try {
      const res = await fetch(url, {
        headers: H,
        ...opts,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error ${res.status}: ${text}`);
      }
      return res.json() as Promise<T>;
    } catch (e: any) {
      clearTimeout(timer);
      lastError = e;
      // Don't retry on HTTP errors (4xx/5xx) — only on network failures
      if (e?.message?.startsWith("API error")) throw e;
      if (attempt < retries - 1) {
        // Exponential backoff: 800ms, 1600ms, 3200ms…
        await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export const api = {
  listItineraries: () => req<ItineraryMeta[]>(`${BASE}/itineraries`),

  getItinerary: (id: string) =>
    req<Itinerary>(`${BASE}/itineraries/${id}`),

  createItinerary: (data: CreateItineraryInput) =>
    req<Itinerary>(`${BASE}/itineraries`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateItinerary: (id: string, data: Partial<Itinerary>) =>
    req<Itinerary>(`${BASE}/itineraries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteItinerary: (id: string) =>
    req<{ success: boolean }>(`${BASE}/itineraries/${id}`, {
      method: "DELETE",
    }),

  igImport: (itineraryId: string, day: number, igUrl: string) =>
    req<{ spot: any; itinerary: Itinerary }>(`${BASE}/ig-import`, {
      method: "POST",
      body: JSON.stringify({ itineraryId, day, igUrl }),
    }),

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (username: string, password: string) =>
    req<{ success: boolean; token: string; username: string }>(
      `${BASE}/auth/login`,
      { method: "POST", body: JSON.stringify({ username, password }) },
      1 // no retry on login
    ),

  verifySession: (token: string) =>
    req<{ valid: boolean; username?: string }>(
      `${BASE}/auth/verify`,
      { method: "POST", body: JSON.stringify({ token }) },
      1
    ),

  logout: (token: string) =>
    req<{ success: boolean }>(
      `${BASE}/auth/logout`,
      { method: "POST", body: JSON.stringify({ token }) },
      1
    ),

  // ── Members ───────────────────────────────────────────────────────────────
  listMembers: () => req<Member[]>(`${BASE}/members`),

  createMember: (name: string) =>
    req<Member>(`${BASE}/members`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  deleteMember: (id: string) =>
    req<{ success: boolean }>(`${BASE}/members/${id}`, {
      method: "DELETE",
    }),
};

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
  createdAt: string;
}