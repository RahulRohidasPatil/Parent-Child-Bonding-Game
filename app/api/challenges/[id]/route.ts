import { declineChallenge, getChallenge, requireUserId, respond } from "@/lib/server/social";

export async function GET(_req: Request, ctx: RouteContext<"/api/challenges/[id]">) {
  return respond(async () => getChallenge(await requireUserId(), (await ctx.params).id));
}

/** Decline (the friend) or call off (the sender) a duel the friend hasn't played yet. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/challenges/[id]">) {
  return respond(async () => declineChallenge(await requireUserId(), (await ctx.params).id));
}
