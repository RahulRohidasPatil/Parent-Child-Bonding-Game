import type { NextRequest } from "next/server";
import {
  type AuthSession,
  UpstreamError,
  authApi,
  clearSession,
  currentUser,
  readDetail,
  readTokens,
  saveSession,
  toPublicUser,
} from "@/lib/server/session";
import { type RegistrationInput, accountEmail, emailMode, validate } from "@/lib/registration";
import { supabaseConfigured } from "@/lib/server/supabase-auth";

/**
 * Same-origin auth endpoints for the browser:
 *   POST /api/auth/login     {login, password}
 *   POST /api/auth/register  {name, role, dob, email, parentEmail, username, password, confirm}
 *   POST /api/auth/verify    {email, token}
 *   POST /api/auth/resend    {email}
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *   GET  /api/auth/demo-accounts
 */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const OFFLINE = "Can’t reach the QuestNest server. Check that the auth API is running, then try again.";

async function body<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  try {
    if (action === "me") {
      const me = await currentUser();
      if (me) return json({ user: toPublicUser(me.user) });
      await clearSession(); // stale cookies would otherwise bounce between /login and /home
      return json({ detail: "Not signed in." }, 401);
    }
    if (action === "demo-accounts") {
      const res = await authApi("/auth/demo-accounts");
      return res.ok ? json(await res.json()) : json([]);
    }
  } catch (err) {
    return json({ detail: OFFLINE }, err instanceof UpstreamError ? 502 : 503);
  }
  return json({ detail: "Not found." }, 404);
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  try {
    switch (action) {
      case "login":
        return await login(req);
      case "register":
        return await register(req);
      case "verify":
        return await verify(req);
      case "resend":
        return await resend(req);
      case "logout":
        return await logout();
    }
  } catch {
    return json({ detail: OFFLINE }, 503);
  }
  return json({ detail: "Not found." }, 404);
}

async function login(req: NextRequest) {
  const b = await body<{ login?: string; password?: string }>(req);
  const login = (b?.login ?? "").trim();
  const password = b?.password ?? "";
  if (!login || !password) return json({ detail: "Enter your username and password." }, 422);
  if (!login.includes("@")) {
    // The auth API signs in by email. Username lookup needs a backend endpoint (see README).
    return json({ detail: "Username sign-in isn’t available on the server yet. Use the email you registered with.", field: "login" }, 422);
  }
  const res = await authApi("/auth/login", { method: "POST", body: JSON.stringify({ email: login, password }) });
  if (res.status === 401) return json({ detail: "That username or password isn’t right." }, 401);
  if (res.status === 403) return json({ detail: "This account isn’t activated yet. Check the email for the verification code.", unverified: true }, 403);
  if (res.status === 429) return json({ detail: "Too many tries. Wait a minute and try again." }, 429);
  if (!res.ok) return json({ detail: await readDetail(res, "Couldn’t sign in. Try again.") }, res.status);
  const session = (await res.json()) as AuthSession;
  await saveSession(session);
  return json({ user: toPublicUser(session.user) });
}

async function register(req: NextRequest) {
  const input = await body<RegistrationInput>(req);
  if (!input) return json({ detail: "Invalid form." }, 422);
  const errors = validate(input);
  if (Object.keys(errors).length) return json({ detail: "Some fields need fixing.", errors }, 422);

  const minor = emailMode(input) === "minor";
  const email = accountEmail(input);
  const res = await authApi("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: input.password,
      display_name: input.name.trim(),
      account_type: input.role === "parent" ? "parent" : "learner",
      // Stored on the Supabase account so lessons can use the learner's age. The FastAPI auth API rejects extra fields.
      ...(supabaseConfigured ? { birth_date: input.dob } : {}),
    }),
  });
  if (res.status === 409)
    return json({ detail: "Sign-up is switched off while the server runs in demo mode. Log in with a demo account instead.", demo: true }, 409);
  if (res.status === 429) return json({ detail: "Too many sign-ups right now. Wait a minute and try again." }, 429);
  if (!res.ok) return json({ detail: await readDetail(res, "Couldn’t create the account. Try again.") }, res.status);
  return json({ sentTo: email, minor }, 202);
}

async function verify(req: NextRequest) {
  const b = await body<{ email?: string; token?: string }>(req);
  const email = (b?.email ?? "").trim();
  const token = (b?.token ?? "").replace(/\s/g, "");
  if (!email || token.length < 6) return json({ detail: "Enter the code from the email." }, 422);
  const res = await authApi("/auth/verify", { method: "POST", body: JSON.stringify({ email, token, type: "signup" }) });
  if (res.status === 401) return json({ detail: "That code is wrong or has expired. Ask for a new one." }, 401);
  if (res.status === 409) return json({ detail: "Verification is switched off in demo mode." }, 409);
  if (!res.ok) return json({ detail: await readDetail(res, "Couldn’t verify the code. Try again.") }, res.status);
  const session = (await res.json()) as AuthSession;
  await saveSession(session);
  return json({ user: toPublicUser(session.user) });
}

async function resend(req: NextRequest) {
  const b = await body<{ email?: string }>(req);
  const email = (b?.email ?? "").trim();
  if (!email) return json({ detail: "Missing email." }, 422);
  const res = await authApi("/auth/resend", { method: "POST", body: JSON.stringify({ email }) });
  if (res.status === 409) return json({ detail: "Resending is switched off in demo mode." }, 409);
  if (res.status === 429) return json({ detail: "Please wait a little before asking again." }, 429);
  if (!res.ok) return json({ detail: await readDetail(res, "Couldn’t resend. Try again.") }, res.status);
  return json({ ok: true }, 202);
}

async function logout() {
  const { access } = await readTokens();
  if (access) {
    await authApi("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${access}` } }).catch(() => null);
  }
  await clearSession();
  return new Response(null, { status: 204 });
}
