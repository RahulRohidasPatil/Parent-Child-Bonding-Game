/** Optional real-FastAPI contract round trip using synthetic RSA tokens, never real account credentials. */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const selected = vi.hoisted(() => ({ who: "alice", players: {} as Record<string, { id: string; playerId: string; token: string }> }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => {
    const player = selected.players[selected.who];
    return { userId: player.id, sessionId: `sess_${selected.who}`, sessionClaims: { player_id: player.playerId, username: selected.who }, getToken: async () => player.token };
  },
  clerkClient: vi.fn(() => { throw new Error("This fixture uses signed session claims, not provider lookups"); }),
}));
const file = process.env.SOCIAL_INTEGRATION_FIXTURE;
const fixture = file ? JSON.parse(readFileSync(file, "utf8")) as { url: string; players: typeof selected.players } : null;

describe.skipIf(!fixture)("frontend proxy to real FastAPI", () => {
  let social: typeof import("../app/api/social/[...path]/route");
  let app: typeof import("../app/api/[...path]/route");
  beforeAll(async () => {
    if (new URL(fixture!.url).hostname !== "127.0.0.1") throw new Error("Integration tests require an isolated loopback fixture");
    const marker = await (await fetch(`${fixture!.url}/__fixture/info`)).json();
    if (marker.synthetic !== true) throw new Error("Refusing to write to a non-fixture backend");
    vi.stubEnv("LEARNING_API_URL", fixture!.url);
    selected.players = fixture!.players;
    social = await import("../app/api/social/[...path]/route");
    app = await import("../app/api/[...path]/route");
  });
  const call = async (method: "GET" | "POST" | "PUT", path: string, who = "alice", body?: unknown) => {
    selected.who = who;
    const url = new URL(`http://frontend.test/api/social/${path}`);
    const req = Object.assign(new Request(url, { method, ...(body !== undefined ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) }), { nextUrl: url }) as NextRequest;
    return social[method](req, { params: Promise.resolve({ path: url.pathname.slice("/api/social/".length).split("/") }) });
  };

  it("registers friends, sends an invite, finishes a duel and reads the paid wallet", async () => {
    for (const who of ["alice", "bob"]) {
      expect((await call("PUT", "me", who, { display_name: who, avatar: "nova", role: "learner" })).status).toBe(200);
    }
    expect((await call("POST", "presence", "bob", { state: "online" })).status).toBe(200);
    const search = await (await call("GET", "users/search?q=bo")).json();
    expect(search.users[0].id).toBe("user_bob");
    const sent = await (await call("POST", "friend-requests", "alice", { username: "bob" })).json();
    expect((await call("POST", `friend-requests/${sent.request.id}/accept`, "bob")).status).toBe(200);
    const made = await call("POST", "duels", "alice", { opponent_id: "user_bob", lesson_id: "fixture-lesson", num_questions: 3 });
    expect(made.status).toBe(201);
    const duel = await made.json();
    expect(duel.questions).toBeNull();
    const heartbeat = await (await call("POST", "presence", "bob", { state: "online" })).json();
    expect(heartbeat.invites[0].id).toBe(duel.id);
    expect((await call("POST", `duels/${duel.id}/accept`, "bob")).status).toBe(200);
    await fetch(`${fixture!.url}/__fixture/advance`, { method: "POST" });
    for (const who of ["alice", "bob"]) {
      for (let index = 0; index < 3; index++) {
        expect((await call("POST", `duels/${duel.id}/answers`, who, { index, choice: who === "alice" ? 1 : 0 })).status).toBe(200);
      }
    }
    const result = await (await call("GET", `duels/${duel.id}`)).json();
    expect(result.status).toBe("finished");
    expect(result.results.me.score).toBe(3);
    selected.who = "alice";
    const url = new URL("http://frontend.test/api/me/wallet?limit=1");
    const request = Object.assign(new Request(url), { nextUrl: url }) as NextRequest;
    const paid = await app.GET(request, { params: Promise.resolve({ path: ["me", "wallet"] }) });
    expect((await paid.json()).coins).toBe(290);
    await call("GET", `duels/${duel.id}`);
    const again = await app.GET(request, { params: Promise.resolve({ path: ["me", "wallet"] }) });
    expect((await again.json()).coins).toBe(290);
  });
});
