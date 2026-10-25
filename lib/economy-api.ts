import { http } from "./learn-api";
import { getAccountKey, setState } from "./store";
import { AVATARS, type AvatarId } from "./qn-data";

export type ShopItem = { id: string; name: string; slot: string; price: number; starter: boolean; asset_pack: string };
export type Inventory = { owned: string[]; equipped: Record<string, string | null> };
export type Quest = { id: string; title: string; kind: "daily" | "weekly"; period: string; resets_at: string; progress: number; target: number; reward: number; claimed: boolean; claimable: boolean };
export type Quests = { timezone: string; items: Quest[] };
export type Coins = { coins: number; credited: number };
export function applyCoins(coins: number) {
  setState((s) => ({ coins, serverCoins: coins, unlimitedCoins: false, ...(s.homeMeta ? { homeMeta: { ...s.homeMeta, coins } } : {}) }));
}
export function applyInventory(value: Inventory) {
  const look = AVATARS.some((a) => a.id === value.equipped.look) ? value.equipped.look as AvatarId : "nova";
  setState({ owned: value.owned, equipped: value.equipped, look, pet: value.equipped.pet === "cat" ? "cat" : null });
  return value;
}
async function scoped<T>(run: () => Promise<T>, apply: (value: T) => void): Promise<T> {
  const account = getAccountKey();
  const value = await run();
  if (account === getAccountKey()) apply(value);
  return value;
}
export const economyApi = {
  catalog: () => http.get<ShopItem[]>("shop/catalog"),
  inventory: () => scoped(() => http.get<Inventory>("me/inventory"), applyInventory),
  equip: (slot: string, item: string | null) => scoped(() => http.put<Inventory>(`me/equipment/${encodeURIComponent(slot)}`, { item_id: item }), applyInventory),
  buy: (item: string) => scoped(() => http.post<{ coins: number; charged: number; inventory: Inventory }>("me/shop/purchases", { item_id: item }), (r) => { applyCoins(r.coins); applyInventory(r.inventory); }),
  quests: () => scoped(() => http.get<Quests>("me/quests"), (r) => setState({ progress: Object.fromEntries(r.items.map((q) => [q.id, q.progress])), claimed: r.items.filter((q) => q.claimed).map((q) => q.id) })),
  claim: (quest: Quest) => scoped(() => http.post<Coins>(`me/quests/${encodeURIComponent(quest.id)}/claim`, { period: quest.period }), (r) => applyCoins(r.coins)),
  claimMatchDuel: (id: string) => scoped(() => http.post<Coins>("me/coins/claim-duel", { match_id: id }), (r) => applyCoins(r.coins)),
  claimDuel: (id: string) => scoped(() => http.post<Coins>("me/coins/claim-duel", { tournament_id: id }), (r) => applyCoins(r.coins)),
  participation: (source: "quiz" | "tournament" | "match" | "diagram_race", id: string) => scoped(() => http.post<Coins>("me/coins/claim-participation", { source, id }), (r) => applyCoins(r.coins)),
};
