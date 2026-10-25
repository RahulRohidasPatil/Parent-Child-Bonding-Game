import "server-only";

import { randomUUID } from "node:crypto";
import { auth, clerkClient, type User as ClerkUser } from "@clerk/nextjs/server";
import type { PublicUser } from "@/lib/server/session";

/**
 * The one place this app talks to the learning service as a signed-in user (see docs/SESSION.md).
 *
 * Every call carries both:
 *   - `Authorization: Bearer <Clerk session JWT>`, so the service can verify who is calling
 *     (Clerk’s JWKS) on /api/social; legacy routes retain their player-selector contract;
 *   - `X-Player-ID: <uuid>`, the account's player, which is what the service partitions data by today.
 *
 * The player id is a random UUID in the account's Clerk public metadata (`player_id`). Add it to
 * the session token in Clerk (Sessions > Customize session token: `{"player_id": "{{user.public_metadata.player_id}}"}`)
 * and the verified JWT carries the same id, so the service can trust the token instead of the header.
 */

export const LEARNING_API_URL = (process.env.LEARNING_API_URL || "http://127.0.0.1:8001").replace(/\/$/, "");

export type LearningSession = { userId: string; playerId: string; token: string | null };

export class LearningUnavailable extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asPlayerId = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);
const creating = new Map<string, Promise<{ playerId: string; created: boolean }>>();

/** The signed-in account's learning session, or null when signed out. Creates the player id on first use. */
export async function learningSession(options: { social?: boolean } = {}): Promise<(LearningSession & { created: boolean }) | null> {
  const { userId, sessionId, sessionClaims, getToken } = await auth();
  if (!userId) return null;
  // With the customised session token, the id comes from the verified JWT and no Clerk API call is needed.
  const claimed = asPlayerId((sessionClaims as Record<string, unknown> | null)?.player_id);
  const { playerId, created } = claimed ? { playerId: claimed, created: false } : await ensurePlayerId(userId);
  // auth().getToken() returns the request's token. After metadata changes, mint a fresh
  // session token so FastAPI receives the newly signed player_id/username claims now.
  const claims = sessionClaims as Record<string, unknown> | null;
  const refresh = created || !claimed || (options.social && !claims?.username);
  const token = refresh && sessionId
    ? (await (await clerkClient()).sessions.getToken(sessionId)).jwt
    : await getToken();
  return { userId, playerId, created, token };
}

function savedPlayerId(u: ClerkUser) {
  return asPlayerId(u.publicMetadata?.player_id) ?? asPlayerId(u.privateMetadata?.player_id);
}

/** Reads the account's player id, creating it once (even if several first requests race). */
function ensurePlayerId(userId: string): Promise<{ playerId: string; created: boolean }> {
  let pending = creating.get(userId);
  if (!pending) {
    pending = (async () => {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const saved = savedPlayerId(user);
      if (saved && asPlayerId(user.publicMetadata?.player_id)) return { playerId: saved, created: false };
      // New account, or one from before the id moved to public metadata (where the session token can read it).
      const playerId = saved ?? randomUUID();
      await client.users.updateUserMetadata(userId, { publicMetadata: { player_id: playerId }, privateMetadata: { player_id: null } });
      return { playerId, created: true };
    })().finally(() => creating.delete(userId));
    creating.set(userId, pending);
  }
  return pending;
}

/** Headers for a learning-service call on behalf of this session. */
export function learningHeaders(session: LearningSession, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("X-Player-ID", session.playerId);
  if (session.token) headers.set("Authorization", `Bearer ${session.token}`);
  return headers;
}

/** `fetch` to the learning service's `/api/<path>` as this session. Throws `LearningUnavailable` if it can't be reached. */
export async function learningFetch(session: LearningSession, path: string, init: RequestInit & { headers?: HeadersInit } = {}): Promise<Response> {
  try {
    return await fetch(`${LEARNING_API_URL}/api/${path}`, { ...init, headers: learningHeaders(session, init.headers), cache: "no-store" });
  } catch {
    throw new LearningUnavailable();
  }
}

/**
 * Session start, run after login: tells the service who this player is (role label and display
 * name). Best effort: false if the service can't be reached, which never blocks logging in.
 * When the service gets its own session endpoint, this is the call to swap for it.
 */
export async function startLearningSession(session: LearningSession, user: PublicUser): Promise<boolean> {
  const json = { "content-type": "application/json" };
  const name = user.name.trim() || "Learner";
  try {
    const memory = learningFetch(session, "memory/profile", {
      method: "PUT",
      headers: json,
      body: JSON.stringify({ role: user.accountType === "parent" ? "parent" : "learner", display_name: name.slice(0, 40) }),
    });
    // PUT /api/me/profile replaces the whole profile, so keep its other fields.
    const profile = (async () => {
      const res = await learningFetch(session, "me/profile");
      if (!res.ok) return res;
      const current = (await res.json()) as Record<string, unknown>;
      if (current.display_name === name.slice(0, 60)) return res;
      return learningFetch(session, "me/profile", { method: "PUT", headers: json, body: JSON.stringify({ ...current, display_name: name.slice(0, 60) }) });
    })();
    const results = await Promise.all([memory, profile]);
    return results.every((r) => r.ok);
  } catch {
    return false;
  }
}

const NO_STORE = { "Cache-Control": "no-store" };
const SIGN_IN_DOWN = () => Response.json({ detail: "Can’t reach the sign-in server right now. Please try again." }, { status: 503, headers: NO_STORE });

/**
 * Same-origin proxy body for `/api/<sub>` routes: forwards the request as the signed-in session.
 * `sub` must already be checked against the route's allow-list.
 */
export async function forwardToLearning(req: Request, sub: string, search: string): Promise<Response> {
  let session: LearningSession | null;
  try {
    session = await learningSession({ social: sub.startsWith("social/") });
  } catch {
    return SIGN_IN_DOWN();
  }
  if (!session) return Response.json({ detail: "Please log in again." }, { status: 401, headers: NO_STORE });
  if (sub.startsWith("social/") && !session.token) return SIGN_IN_DOWN();

  // Guardian filters are bound to the signed-in user's verified mailbox, never a browser query.
  if (sub.startsWith("guardian/")) {
    try {
      const user = await (await clerkClient()).users.getUser(session.userId);
      const email = user.emailAddresses.find((value) => value.id === user.primaryEmailAddressId);
      if (!email || email.verification?.status !== "verified") return Response.json({ detail: "Verify your email before reviewing approval requests." }, { status: 403, headers: NO_STORE });
      const query = new URLSearchParams(search);
      query.set("guardian_email", email.emailAddress);
      search = `?${query.toString()}`;
    } catch { return SIGN_IN_DOWN(); }
  }

  const headers = new Headers();
  for (const header of ["content-type", "content-length", "accept", "idempotency-key", "x-registration-receipt"]) {
    const value = req.headers.get(header);
    if (value) headers.set(header, value);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await learningFetch(session, `${sub}${search}`, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by Node's fetch when streaming a request body.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ detail: "Can’t reach the learning server. Check that it is running, then try again." }, { status: 503, headers: NO_STORE });
  }
  // Our session was valid a moment ago, so a 401 here means the service rejected the token. Don't pass it
  // on as 401: the browser would bounce to /login and straight back.
  if (upstream.status === 401) {
    return Response.json({ detail: "Your session could not be verified. Refresh the page or sign in again.", code: "session_rejected" }, { status: 403, headers: NO_STORE });
  }
  const out = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);
  for (const name of ["x-request-id", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}
