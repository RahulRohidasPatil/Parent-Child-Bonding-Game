import type { NextRequest } from "next/server";
import { LEARNING_API_URL, UpstreamError, currentUser } from "@/lib/server/session";
import { resolveLearningPlayerId } from "@/lib/server/player-id";

/**
 * Same-origin proxy to the learning service (`/api/*` in its OpenAPI document).
 * Only signed-in users can reach it: every lesson, quiz and upload spends the model key.
 *   browser: /api/learn/lessons  ->  LEARNING_API_URL/api/lessons
 */
const ALLOWED = /^(materials|lessons|quiz|flashcards|tournament|chat)(\/|$)/;

async function forward(req: NextRequest, ctx: RouteContext<"/api/learn/[...path]">) {
  const { path } = await ctx.params;
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub)) return Response.json({ detail: "Not found." }, { status: 404 });

  let access: string;
  let playerId: string | null;
  try {
    const session = await currentUser();
    if (!session) return Response.json({ detail: "Please log in again." }, { status: 401 });
    access = session.access;
    playerId = resolveLearningPlayerId(session.user.id, req.headers.get("x-player-id"));
  } catch (err) {
    const status = err instanceof UpstreamError ? 502 : 503;
    return Response.json({ detail: "Can’t reach the sign-in server right now." }, { status });
  }

  if (!playerId) return Response.json({ detail: "X-Player-ID must be a UUID." }, { status: 422 });
  // Use the same stable UUID as the primary proxy; never silently select the shared default player.
  const headers = new Headers({ Authorization: `Bearer ${access}`, "X-Player-ID": playerId });
  for (const h of ["content-type", "content-length", "accept"]) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${LEARNING_API_URL}/api/${sub}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by Node's fetch when streaming a request body.
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
    } as RequestInit);
  } catch {
    return Response.json(
      { detail: "Can’t reach the learning server. Check that it is running, then try again." },
      { status: 503 },
    );
  }
  // Our session was valid a moment ago, so a 401 here means the learning service rejected the token
  // (e.g. it runs a different auth mode). Don't pass it on as 401: the browser would bounce to /login and back.
  if (upstream.status === 401) {
    return Response.json(
      { detail: "The learning server didn’t accept your sign-in. Check it uses the same login system as this app." },
      { status: 403 },
    );
  }
  const out = new Headers({ "Cache-Control": "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) out.set("content-type", type);
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}
export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
