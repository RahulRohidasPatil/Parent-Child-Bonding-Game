import type { NextRequest } from "next/server";
import { forwardToLearning } from "@/lib/server/learning-session";

/**
 * Same-origin proxy to the learning service (`/api/*` in its OpenAPI document), as the signed-in player.
 * Only signed-in users can reach it: every lesson, quiz and upload spends the model key.
 *   browser: /api/learn/lessons  ->  LEARNING_API_URL/api/lessons
 */
const ALLOWED = /^(materials|lessons|quiz|flashcards|tournament|chat)(\/|$)/;

async function forward(req: NextRequest, ctx: RouteContext<"/api/learn/[...path]">) {
  const { path } = await ctx.params;
  const sub = path.map(encodeURIComponent).join("/");
  if (!ALLOWED.test(sub)) return Response.json({ detail: "Not found." }, { status: 404 });
  return forwardToLearning(req, sub, req.nextUrl.search);
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
