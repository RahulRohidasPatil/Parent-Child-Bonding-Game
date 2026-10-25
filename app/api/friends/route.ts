import { readJson, requireUserId, respond, sendRequest, snapshot } from "@/lib/server/social";

/** Everything the Friends screen shows: friends, requests both ways and duels. */
export async function GET() {
  return respond(async () => snapshot(await requireUserId()));
}

/** Send a friend request by username: `{ username }`. */
export async function POST(req: Request) {
  return respond(async () => {
    const me = await requireUserId();
    const { username } = await readJson(req);
    return sendRequest(me, typeof username === "string" ? username : "");
  }, 201);
}
