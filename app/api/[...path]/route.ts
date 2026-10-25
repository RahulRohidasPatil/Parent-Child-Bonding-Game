import type { NextRequest } from "next/server";
import { proxyLearningRequest } from "@/lib/server/learning-proxy";

async function forward(req: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const { path } = await ctx.params;
  return proxyLearningRequest(req, path);
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
