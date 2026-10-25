import type { NextRequest } from "next/server";
import { forwardToLearning } from "@/lib/server/learning-session";

/** Same-origin proxy for the learning service's documented `/api/*` endpoints. */
const ALLOWED = /^(materials|lessons|quiz|flashcards|tournament|chat|me|homes|shop|rooms|matches|challenges)(\/|$)/;

async function forward(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub)) return Response.json({ detail: "Not found." }, { status: 404 });
  return forwardToLearning(req, sub, req.nextUrl.search);
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
export const PUT = forward;
export const PATCH = forward;
