import { beforeEach, expect, it, vi } from "vitest";
import type { DuelSheet } from "../lib/social-api";

beforeEach(() => {
  vi.resetModules();
  const values = new Map<string, string>();
  vi.stubGlobal("window", {});
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
});

it("replaces the cached balance from the server and never awards it twice", async () => {
  const store = await import("../lib/store");
  store.setAccount("alice");
  store.setState({ coins: 999999, unlimitedCoins: true });
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({ coins: 290 })));
  const { refreshWallet } = await import("../lib/wallet-api");
  await refreshWallet();
  await refreshWallet();
  expect(store.getState().serverCoins).toBe(290);
  expect(store.getState().coins).toBe(290);
  expect(store.getState().unlimitedCoins).toBe(false);
});

it("discards the old account's response after switching accounts", async () => {
  const store = await import("../lib/store");
  store.setAccount("alice");
  let resolve!: (response: Response) => void;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((done) => { resolve = done; })));
  const { refreshWallet } = await import("../lib/wallet-api");
  const pending = refreshWallet();
  store.setAccount("bob");
  resolve(Response.json({ coins: 700 }));
  await pending;
  expect(store.getState().serverCoins).toBeNull();
});

it("shows zero participation coins for idle players and 20 for a zero-score participant", async () => {
  const { duelReward } = await import("../lib/wallet-api");
  const sheet = { score: 0, total: 1, results: [{ index: 0, choice: null, correct: false, answer_index: 1, explanation: "" }] } satisfies DuelSheet;
  expect(duelReward(sheet)).toBe(0);
  expect(duelReward({ ...sheet, results: [{ ...sheet.results[0], choice: 0 }] })).toBe(20);
});

it("does not let a slower old refresh overwrite a newer paid balance", async () => {
  const store = await import("../lib/store");
  store.setAccount("alice");
  const replies: ((response: Response) => void)[] = [];
  vi.stubGlobal("fetch", vi.fn().mockImplementation(() => new Promise<Response>((done) => { replies.push(done); })));
  const { refreshWallet } = await import("../lib/wallet-api");
  const old = refreshWallet();
  const current = refreshWallet();
  replies[1](Response.json({ coins: 290 }));
  await current;
  replies[0](Response.json({ coins: 240 }));
  await old;
  expect(store.getState().serverCoins).toBe(290);
});
