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
  return json({ detail: "Use Clerk for authentication." }, 410);
}
