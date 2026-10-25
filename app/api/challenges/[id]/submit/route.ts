import { readJson, requireUserId, respond, submitChallenge } from "@/lib/server/social";

/** `{ answers: [choice, ...] }`, one per question; each player submits once. */
export async function POST(req: Request, ctx: RouteContext<"/api/challenges/[id]/submit">) {
  return respond(async () => {
    const me = await requireUserId();
    const { id } = await ctx.params;
    const { answers } = await readJson(req);
    return submitChallenge(me, id, answers);
  });
}
