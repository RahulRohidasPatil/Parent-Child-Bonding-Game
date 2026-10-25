import type { NextRequest } from "next/server";
import { LEARNING_API_URL, UpstreamError, currentUser } from "@/lib/server/session";

/** Same-origin proxy for the learning service's documented `/api/*` endpoints. */
const ALLOWED = /^(materials|lessons|quiz|flashcards|tournament|chat)(\/|$)/;

async function forward(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub)) return Response.json({ detail: "Not found." }, { status: 404 });

  let session: Awaited<ReturnType<typeof currentUser>>;
  try {
    session = await currentUser();
    if (!session) return Response.json({ detail: "Please log in again." }, { status: 401 });
  } catch (err) {
    const status = err instanceof UpstreamError ? 502 : 503;
    return Response.json({ detail: "Can’t reach the sign-in server right now." }, { status });
  }

  const headers = new Headers();
  for (const header of ["content-type", "content-length", "accept"]) {
    const value = req.headers.get(header);
    if (value) headers.set(header, value);
  }
  headers.set("authorization", `Bearer ${session.access}`);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(`${LEARNING_API_URL}/api/${sub}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
    } as RequestInit);
  } catch {
    return Response.json({ detail: "Can’t reach the learning server. Check that it is running, then try again." }, { status: 503 });
  }
  const out = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) out.set("content-type", contentType);
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
