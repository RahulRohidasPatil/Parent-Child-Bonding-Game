import type { NextRequest } from "next/server";
import { forwardLearningRequest } from "@/lib/server/learning-proxy";
async function forward(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  return forwardLearningRequest(req, (await ctx.params).path);
}
export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
