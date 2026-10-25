import type { NextRequest } from "next/server";
import { forwardToLearning } from "@/lib/server/learning-session";

// FastAPI is the source of truth for friends, presence, live duels and their rewards.
const ALLOWED = /^(me|presence|users\/search|friends(?:\/[^/]+)?|friend-requests(?:\/[^/]+(?:\/(?:accept|decline))?)?|duels(?:\/[^/]+(?:\/(?:accept|decline|cancel|answers))?)?)$/;

async function route(req: NextRequest, ctx: RouteContext<"/api/social/[...path]">) {
  const { path } = await ctx.params;
  const sub = path.map(encodeURIComponent).join("/");
  if (path.some((part) => part === "." || part === "..") || !ALLOWED.test(sub)) {
    return Response.json({ detail: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return forwardToLearning(req, `social/${sub}`, req.nextUrl.search);
}

export const GET = route;
export const POST = route;
export const PUT = route;
export const DELETE = route;
