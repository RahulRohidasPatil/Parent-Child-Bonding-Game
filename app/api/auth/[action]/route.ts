import { learningSession, startLearningSession } from "@/lib/server/learning-session";
import { currentUser, toPublicUser } from "@/lib/server/session";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET(_req: Request, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  if (action !== "me") return json({ detail: "Not found." }, 404);
  const me = await currentUser();
  return me ? json({ user: toPublicUser(me.user) }) : json({ detail: "Not signed in." }, 401);
}

export async function POST(_req: Request, ctx: RouteContext<"/api/auth/[action]">) {
  const { action } = await ctx.params;
  if (action === "logout") return new Response(null, { status: 204 });
  if (action === "session") return startSession();
  return json({ detail: "Use Clerk for authentication." }, 410);
}

/**
 * Session start, called once after logging in (and once per browser tab as a fallback): makes sure
 * the account has its own learning-service player and that the service knows its name and role.
 * `refreshToken` asks the browser for a new Clerk token so it carries a just-created `player_id`.
 */
async function startSession() {
  let me: Awaited<ReturnType<typeof currentUser>>;
  let session: Awaited<ReturnType<typeof learningSession>>;
  try {
    [me, session] = await Promise.all([currentUser(), learningSession()]);
  } catch {
    return json({ detail: "Can’t reach the sign-in server right now." }, 503);
  }
  if (!me || !session) return json({ detail: "Not signed in." }, 401);
  const user = toPublicUser(me.user);
  const learning = await startLearningSession(session, user);
  return json({ user, learning, refreshToken: session.created });
}
