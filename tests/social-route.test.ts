import { expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
const proxy = vi.hoisted(() => vi.fn(async () => Response.json({ ok: true })));
vi.mock("../lib/server/learning-session", () => ({ forwardToLearning: proxy }));
import { GET, POST, PUT, DELETE } from "../app/api/social/[...path]/route";

it.each([
  [PUT, ["me"]], [POST, ["presence"]], [GET, ["users", "search"]], [GET, ["friends"]],
  [POST, ["friend-requests"]], [POST, ["friend-requests", "req_1", "accept"]],
  [POST, ["friend-requests", "req_1", "decline"]], [DELETE, ["friend-requests", "req_1"]],
  [DELETE, ["friends", "user_bob"]], [POST, ["duels"]], [GET, ["duels", "current"]],
  [GET, ["duels", "duel_1"]], [POST, ["duels", "duel_1", "accept"]],
  [POST, ["duels", "duel_1", "decline"]], [POST, ["duels", "duel_1", "cancel"]], [POST, ["duels", "duel_1", "answers"]],
] as const)("forwards the social contract operation %# to FastAPI", async (handler, path) => {
  const req = Object.assign(new Request("http://app.test/api/social/test?q=bo"), { nextUrl: new URL("http://app.test/api/social/test?q=bo") }) as NextRequest;
  const response = await handler(req, { params: Promise.resolve({ path: [...path] }) });
  expect(response.status).toBe(200);
  expect(proxy).toHaveBeenCalledWith(req, `social/${path.join("/")}`, "?q=bo");
});

it("rejects unrelated and traversal paths without calling the backend", async () => {
  proxy.mockClear();
  const req = Object.assign(new Request("http://app.test/api/social/test"), { nextUrl: new URL("http://app.test/api/social/test") }) as NextRequest;
  for (const path of [["admin"], ["duels", ".."], ["me", "extra"]]) {
    expect((await GET(req, { params: Promise.resolve({ path }) })).status).toBe(404);
  }
  expect(proxy).not.toHaveBeenCalled();
});
