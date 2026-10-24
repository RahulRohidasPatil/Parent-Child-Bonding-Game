import "server-only";
import { cookies } from "next/headers";
import { supabaseAuthApi, supabaseConfigured } from "./supabase-auth";
import { ageFrom } from "@/lib/registration";

/**
 * Same-origin session layer over the auth API (see the backend repo's API.md).
 * The API returns Bearer tokens and sets no cookies, so we keep both tokens in
 * httpOnly cookies here: browser JavaScript never sees them.
 */
export const AUTH_API_URL = (process.env.AUTH_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
export const LEARNING_API_URL = (process.env.LEARNING_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

const ACCESS = "qn_at";
const REFRESH = "qn_rt";

export type AuthUser = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number | null;
  user: AuthUser;
};

/** What the browser gets: never tokens, only display data. */
export type PublicUser = {
  id: string;
  email: string | null;
  name: string;
  accountType: "parent" | "learner" | null;
  /** From the account's date of birth (set at sign-up); null for accounts without one. */
  age: number | null;
  demo: boolean;
};

export function toPublicUser(u: AuthUser): PublicUser {
  const meta = u.user_metadata || {};
  const name = typeof meta.display_name === "string" && meta.display_name.trim() ? meta.display_name : (u.email?.split("@")[0] ?? "Friend");
  const t = meta.account_type;
  return {
    id: u.id,
    email: u.email,
    name,
    accountType: t === "parent" || t === "learner" ? t : null,
    age: accountAge(meta.birth_date),
    demo: meta.demo === true,
  };
}

function accountAge(birthDate: unknown): number | null {
  const age = typeof birthDate === "string" ? ageFrom(birthDate) : null;
  return age !== null && age >= 0 ? age : null;
}

const secure = process.env.NODE_ENV === "production";

export async function saveSession(s: AuthSession) {
  const jar = await cookies();
  const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
  jar.set(ACCESS, s.access_token, { ...base, maxAge: Math.max(60, s.expires_in || 3600) });
  // Refresh lifetime is provider-managed; demo mode allows 24 h.
  jar.set(REFRESH, s.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

export async function readTokens() {
  const jar = await cookies();
  return { access: jar.get(ACCESS)?.value ?? null, refresh: jar.get(REFRESH)?.value ?? null };
}

export async function authApi(path: string, init: RequestInit = {}) {
  // With Supabase keys in .env.local, go straight to Supabase Auth; otherwise use the auth API server.
  if (supabaseConfigured) return supabaseAuthApi(path, init);
  return fetch(`${AUTH_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });
}

/**
 * Current user, refreshing the session once if the access token expired.
 * Returns null when there is no valid session (and clears stale cookies).
 */
export async function currentUser(): Promise<{ user: AuthUser; access: string } | null> {
  const { access, refresh } = await readTokens();
  if (access) {
    const res = await authApi("/auth/me", { headers: { Authorization: `Bearer ${access}` } });
    if (res.ok) return { user: (await res.json()) as AuthUser, access };
    if (res.status !== 401) throw new UpstreamError(res.status);
  }
  if (!refresh) return null;
  const res = await authApi("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token: refresh }) });
  if (!res.ok) {
    if (res.status === 401) await clearSession();
    if (res.status >= 500) throw new UpstreamError(res.status);
    return null;
  }
  const session = (await res.json()) as AuthSession;
  await saveSession(session);
  return { user: session.user, access: session.access_token };
}

export class UpstreamError extends Error {
  constructor(public status: number) {
    super(`Upstream error ${status}`);
  }
}

/** FastAPI errors are `{detail: string}` or `{detail: [{msg}]}`; turn either into one sentence. */
export async function readDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) return String(body.detail[0].msg);
  } catch {
    /* not JSON */
  }
  return fallback;
}
