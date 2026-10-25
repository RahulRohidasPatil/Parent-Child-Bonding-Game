import "server-only";
import type { NextRequest } from "next/server";
import { LEARNING_API_URL, UpstreamError, currentUser } from "./session";

const ALLOWED =
  /^(materials|lessons|quiz|flashcards|tournament|rooms|diagram-assembly)(\/|$)|^resources\/lessons$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Frontend sessions stay required; the learning backend uses UUID selectors, not Bearer auth. */
export async function forwardLearningRequest(req: NextRequest, path: string[]) {
  if (path.some((part) => part === "." || part === ".." || /[\\/]/.test(part)))
    return Response.json({ detail: "Not found." }, { status: 404 });
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub))
    return Response.json({ detail: "Not found." }, { status: 404 });
  let session: Awaited<ReturnType<typeof currentUser>>;
  try {
    session = await currentUser();
    if (!session)
      return Response.json({ detail: "Please log in again." }, { status: 401 });
  } catch (error) {
    return Response.json(
      { detail: "Cannot reach the sign-in server." },
      { status: error instanceof UpstreamError ? 502 : 503 },
    );
  }
  // Never omit this: omission selects the backend's shared default player partition.
  const playerId = req.headers.get("x-player-id") ?? session.user.id;
  if (!UUID.test(playerId))
    return Response.json(
      { detail: "X-Player-ID must be a UUID." },
      { status: 422 },
    );
  const headers = new Headers({ "X-Player-ID": playerId });
  for (const name of ["content-type", "accept", "idempotency-key"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  try {
    const upstream = await fetch(
      `${LEARNING_API_URL}/api/${sub}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
        ...(hasBody ? { duplex: "half" } : {}),
        cache: "no-store",
        signal: AbortSignal.any([req.signal, AbortSignal.timeout(60_000)]),
      } as RequestInit,
    );
    const out = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) out.set(name, value);
    }
    return new Response(upstream.status === 204 ? null : upstream.body, {
      status: upstream.status,
      headers: out,
    });
  } catch {
    return Response.json(
      { detail: "Cannot reach the learning server. Try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
