import { beforeEach, expect, it, vi } from "vitest";
const calls = vi.hoisted(() => ({ saveMe: vi.fn(), presence: vi.fn() }));
vi.mock("../lib/social-api", () => ({ socialApi: calls }));
import { createSocialHeartbeat } from "../lib/social-profile";
const profile = { display_name: "Alice", avatar: "nova" as const, role: "learner" as const };
beforeEach(() => { vi.clearAllMocks(); calls.saveMe.mockResolvedValue({}); calls.presence.mockResolvedValue({ heartbeat_s: 20, online_window_s: 45, invites: [] }); });

it("retries failed registration before sending any presence", async () => {
  calls.saveMe.mockRejectedValueOnce(new Error("temporarily unavailable"));
  const beat = createSocialHeartbeat(profile);
  await expect(beat()).rejects.toThrow("temporarily unavailable");
  expect(calls.presence).not.toHaveBeenCalled();
  await beat();
  await beat();
  expect(calls.saveMe).toHaveBeenCalledTimes(2);
  expect(calls.presence).toHaveBeenCalledTimes(2);
});

it("shares an in-flight heartbeat and restores a removed backend profile", async () => {
  const missing = Object.assign(new Error("profile required"), { code: "profile_required" });
  calls.presence.mockRejectedValueOnce(missing);
  const beat = createSocialHeartbeat(profile);
  const one = beat();
  expect(beat()).toBe(one);
  await expect(one).rejects.toThrow("profile required");
  await beat();
  expect(calls.saveMe).toHaveBeenCalledTimes(2);
});

it("does not mark an unmounted or switched account online after registration finishes", async () => {
  let live = true;
  calls.saveMe.mockImplementationOnce(async () => { live = false; });
  const beat = createSocialHeartbeat(profile, () => live);
  await expect(beat()).rejects.toThrow("Presence stopped");
  expect(calls.presence).not.toHaveBeenCalled();
});
