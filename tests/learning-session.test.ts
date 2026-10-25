import { beforeEach, describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({ auth: vi.fn(), rawToken: vi.fn(), user: vi.fn(), update: vi.fn(), freshToken: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: clerk.auth,
  clerkClient: async () => ({ users: { getUser: clerk.user, updateUserMetadata: clerk.update }, sessions: { getToken: clerk.freshToken } }),
}));
import { forwardToLearning, learningSession } from "../lib/server/learning-session";

const PLAYER = "00000000-0000-4000-8000-000000000001";
const claims = { player_id: PLAYER, username: "alice" };
const auth = (sessionClaims: Record<string, unknown> = claims) => ({ userId: "user_alice", sessionId: "sess_alice", sessionClaims, getToken: clerk.rawToken });

beforeEach(() => {
  vi.clearAllMocks();
  clerk.auth.mockResolvedValue(auth());
  clerk.rawToken.mockResolvedValue("signed-request-token");
  clerk.freshToken.mockResolvedValue({ jwt: "fresh-signed-token" });
  clerk.user.mockResolvedValue({ publicMetadata: { player_id: PLAYER }, privateMetadata: {} });
  clerk.update.mockResolvedValue({});
});

describe("learning-session binding", () => {
  it("uses the signed session claims without a provider lookup", async () => {
    expect(await learningSession({ social: true })).toEqual({ userId: "user_alice", playerId: PLAYER, token: "signed-request-token", created: false });
    expect(clerk.user).not.toHaveBeenCalled();
    expect(clerk.freshToken).not.toHaveBeenCalled();
  });

  it("mints a fresh session token after assigning new player metadata", async () => {
    clerk.auth.mockResolvedValue(auth({ username: "alice" }));
    clerk.user.mockResolvedValue({ publicMetadata: {}, privateMetadata: {} });
    const result = await learningSession({ social: true });
    expect(result?.created).toBe(true);
    expect(result?.playerId).toMatch(/^[\da-f-]{36}$/);
    expect(clerk.update).toHaveBeenCalledWith("user_alice", { publicMetadata: { player_id: result?.playerId }, privateMetadata: { player_id: null } });
    expect(clerk.freshToken).toHaveBeenCalledWith("sess_alice");
    expect(result?.token).toBe("fresh-signed-token");
  });

  it("refreshes a token missing username claims without changing player identity", async () => {
    clerk.auth.mockResolvedValue(auth({ player_id: PLAYER }));
    expect((await learningSession({ social: true }))?.token).toBe("fresh-signed-token");
    expect(clerk.update).not.toHaveBeenCalled();
  });
});

describe("authenticated proxy", () => {
  it("forwards only server-selected identity and preserves bodies and backend error codes", async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ detail: "Friend is offline", code: "offline" }, { status: 409, headers: { "x-request-id": "request-1" } }));
    vi.stubGlobal("fetch", upstream);
    const body = JSON.stringify({ opponent_id: "user_bob", lesson_id: "lesson", num_questions: 3 });
    const request = new Request("http://app.test/api/social/duels", { method: "POST", body, headers: { "content-type": "application/json", "authorization": "Bearer forged", "x-player-id": "forged-player", "idempotency-key": "request-key-123" } });
    const result = await forwardToLearning(request, "social/duels", "");
    const [url, init] = upstream.mock.calls[0];
    expect(url).toMatch(/\/api\/social\/duels$/);
    expect(init.headers.get("Authorization")).toBe("Bearer signed-request-token");
    expect(init.headers.get("X-Player-ID")).toBe(PLAYER);
    expect(init.headers.get("Idempotency-Key")).toBe("request-key-123");
    expect(await new Response(init.body).text()).toBe(body);
    expect(init.duplex).toBe("half");
    expect(result.status).toBe(409);
    expect(await result.json()).toEqual({ detail: "Friend is offline", code: "offline" });
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(result.headers.get("x-request-id")).toBe("request-1");
  });

  it("does not send anonymous social requests upstream", async () => {
    vi.stubGlobal("fetch", vi.fn());
    clerk.auth.mockResolvedValue({ userId: null });
    expect((await forwardToLearning(new Request("http://app.test/api/social/friends"), "social/friends", "")).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
    clerk.auth.mockResolvedValue(auth());
    clerk.rawToken.mockResolvedValue(null);
    expect((await forwardToLearning(new Request("http://app.test/api/social/friends"), "social/friends", "")).status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns upstream auth rejection into a recoverable error without a login loop", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ detail: "Invalid token" }, { status: 401 })));
    const response = await forwardToLearning(new Request("http://app.test/api/social/friends"), "social/friends", "");
    expect(response.status).toBe(403);
    expect((await response.json()).code).toBe("session_rejected");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("preserves query strings and empty 204 responses", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", upstream);
    const response = await forwardToLearning(new Request("http://app.test/api/social/friends/user_bob", { method: "DELETE" }), "social/friends/user_bob", "?test=1");
    expect(upstream.mock.calls[0][0]).toMatch(/\?test=1$/);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});
