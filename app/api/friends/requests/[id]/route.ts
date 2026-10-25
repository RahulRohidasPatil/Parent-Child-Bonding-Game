import { SocialError, answerRequest, readJson, requireUserId, respond } from "@/lib/server/social";

/** `{ action: "accept" | "decline" }` for a request you got, `"cancel"` for one you sent. */
export async function POST(req: Request, ctx: RouteContext<"/api/friends/requests/[id]">) {
  return respond(async () => {
    const me = await requireUserId();
    const { id } = await ctx.params;
    const { action } = await readJson(req);
    if (action !== "accept" && action !== "decline" && action !== "cancel") throw new SocialError(422, "Unknown action.");
    return answerRequest(me, id, action);
  });
}
