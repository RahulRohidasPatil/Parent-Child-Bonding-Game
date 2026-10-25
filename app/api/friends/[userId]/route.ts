import { removeFriend, requireUserId, respond } from "@/lib/server/social";

/** Unfriend. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/friends/[userId]">) {
  return respond(async () => {
    const me = await requireUserId();
    const { userId } = await ctx.params;
    return removeFriend(me, userId);
  });
}
