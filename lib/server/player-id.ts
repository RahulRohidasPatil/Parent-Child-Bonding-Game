import "server-only";
import { createHash } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Fixed UUID URL namespace. Changing this mapping would select different backend records.
const NAMESPACE = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");

/** Preserve existing UUID accounts; map immutable opaque auth IDs to stable UUIDv5 players. */
export function playerIdForAccount(accountId: string): string {
  if (UUID.test(accountId)) return accountId.toLowerCase();
  if (!accountId.trim()) throw new Error("A signed-in account ID is required.");
  const bytes = createHash("sha1")
    .update(NAMESPACE)
    .update("urn:questnest:player:" + encodeURIComponent(accountId), "utf8")
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Old tabs may still send their own raw auth ID. Unrelated malformed selectors stay invalid. */
export function resolveLearningPlayerId(accountId: string, requested: string | null = null): string | null {
  if (requested === null || requested === accountId) return playerIdForAccount(accountId);
  return UUID.test(requested) ? requested.toLowerCase() : null;
}
