import type { NextRequest } from "next/server";
import { LEARNING_API_URL, UpstreamError, currentUser } from "./session";

const ALLOWED = /^(materials|lessons|quiz|flashcards|tournament)(\/|$)/;

/** Forward a same-origin Next.js API request to the learning backend. */
export async function proxyLearningRequest(req: NextRequest, path: string[]) {
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub)) return Response.json({ detail: "Not found." }, { status: 404 });

  try {
    if (!(await currentUser())) return Response.json({ detail: "Please log in again." }, { status: 401 });
  } catch (err) {
    const status = err instanceof UpstreamError ? 502 : 503;
    return Response.json({ detail: "Can’t reach the sign-in server right now." }, { status });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "accept"]) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

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

  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
