/**
 * Client for the learning service's home, friends and coins endpoints (SQLite on the server).
 * The server owns the home and its coins; the local store keeps a copy of the home so every
 * screen that draws it (Home, My base) works the same, and updates it from each response.
 */
import { http } from "./learn-api";
import { ROOMS, roomOf, type HomeSnapshot, type RoomId, type RoomLayout } from "./home-data";
import { AVATARS, type AvatarId } from "./qn-data";
import { setState } from "./store";

/** Someone's avatar reference as one of our looks (anything unknown shows the default). */
export const avatarOf = (ref: string | null | undefined): AvatarId => AVATARS.find((a) => a.id === ref)?.id ?? "nova";

export type Owner = { id: string; display_name: string; avatar: string | null };
export type ServerItem = { id: string; level: number; at?: [number, number] | null; rot?: number };
export type ServerRoom = { id: string; items: ServerItem[] };
export type HomeTotals = { rooms: number; levels: number; max_levels: number };
export type Visibility = "family" | "friends" | "nobody";

/** A home as anyone may see it (a visit). */
export type PublicHome = { owner: Owner; version: number; rooms: ServerRoom[]; summary: HomeTotals };
/** My own home, with its coins, privacy and the cheers it has received. */
export type MyHome = PublicHome & { visibility: Visibility; coins: number; cheers?: Record<string, number> };
export type HomeCard = { owner: Owner } & HomeTotals;
export type Friend = { player_id: string; display_name: string; avatar: string | null; status: "accepted" | "incoming" | "outgoing" };
export type FriendList = { code: string; items: Friend[] };
export type CoinsOut = { coins: number; credited: number };
export type Placement = { at: [number, number] | null; rot: number };

/** What the store keeps about the server's home besides the rooms themselves. */
export type HomeMeta = { coins: number; version: number; visibility: Visibility; cheers: Record<string, number>; owner: Owner };

const isRoom = (id: string): id is RoomId => ROOMS.some((r) => r.id === id);

/** Server rooms (placed items by id) → the level lists and layouts the UI draws. */
export function toSnapshot(rooms: ServerRoom[]): Required<HomeSnapshot> {
  const out: Required<HomeSnapshot> = { rooms: {}, layout: {} };
  for (const r of rooms) {
    if (!isRoom(r.id)) continue; // a room this version of the app doesn't know yet
    const def = roomOf(r.id);
    const byId = new Map(r.items.map((it) => [it.id, it]));
    out.rooms[r.id] = def.items.map((it) => byId.get(it.id)?.level ?? 0);
    const layout: RoomLayout = {};
    for (const it of def.items) {
      const s = byId.get(it.id);
      if (s && (s.at || s.rot)) layout[it.id] = { at: s.at ?? it.at, rot: s.rot ?? 0 };
    }
    if (Object.keys(layout).length) out.layout[r.id] = layout;
  }
  return out;
}

/** One room's layout as the layout endpoint takes it: placed items only, positions rounded. */
export function toPlacements(roomId: RoomId, levels: number[], layout: RoomLayout | undefined): Record<string, Placement> {
  const def = roomOf(roomId);
  const items: Record<string, Placement> = {};
  def.items.forEach((it, i) => {
    const p = layout?.[it.id];
    if (!p || !(levels[i] > 0)) return;
    const clamp = (v: number) => Math.round(Math.min(2.7, Math.max(0, v)) * 1000) / 1000;
    items[it.id] = { at: [clamp(p.at[0]), clamp(p.at[1])], rot: ((p.rot % 4) + 4) % 4 };
  });
  return items;
}

/** Copy a server home into the store, so the base and the Home screen draw it. */
export function applyHome(h: MyHome) {
  setState({
    home: toSnapshot(h.rooms),
    serverCoins: h.coins,
    coins: h.coins,
    unlimitedCoins: false,
    homeMeta: { coins: h.coins, version: h.version, visibility: h.visibility, cheers: h.cheers ?? {}, owner: h.owner },
  });
  return h;
}

export const homeApi = {
  mine: () => http.get<MyHome>("me/home").then(applyHome),
  /** Builds the next room in order; the server checks the unlock rule and the cost. */
  buildRoom: () => http.post<MyHome>("me/home/rooms", {}).then(applyHome),
  place: (room: RoomId, item: string, p: Placement) => http.post<MyHome>(`me/home/items/${room}/${item}/place`, p).then(applyHome),
  upgrade: (room: RoomId, item: string) => http.post<MyHome>(`me/home/items/${room}/${item}/upgrade`, {}).then(applyHome),
  /** Free. Items left out go back to their default spot. */
  layout: (room: RoomId, items: Record<string, Placement>) => http.put<MyHome>(`me/home/rooms/${room}/layout`, { items }).then(applyHome),
  visibility: (visibility: Visibility) => http.put<MyHome>("me/home/visibility", { visibility }).then(applyHome),
  /** The name and avatar friends see. */
  card: (display_name: string, avatar: string | null) => http.put<MyHome>("me/home/card", { display_name: display_name.slice(0, 40), avatar }).then(applyHome),

  friends: () => http.get<FriendList>("me/friends"),
  addFriend: (code: string) => http.post<Friend>("me/friends/requests", { code: code.trim() }),
  accept: (playerId: string) => http.post<Friend>(`me/friends/requests/${playerId}/accept`, {}),
  decline: (playerId: string) => http.post<void>(`me/friends/requests/${playerId}/decline`, {}),
  /** Removes a friend, or cancels a request I sent. */
  remove: (playerId: string) => http.del(`me/friends/${playerId}`),

  homes: (scope: "friends" | "family" = "friends") => http.get<{ items: HomeCard[] }>(`homes?scope=${scope}`).then((r) => r.items),
  visit: (playerId: string) => http.get<PublicHome>(`homes/${playerId}`),
  /** One per room (or `home`) per day; a repeat is a 409. */
  cheer: (playerId: string, roomId: string) => http.post<{ room_id: string; day: string }>(`homes/${playerId}/cheers`, { room_id: roomId }),

  /** Pays 10 coins per first-try-correct answer, once per question. */
  claimQuiz: (quizId: string) => http.post<CoinsOut>("me/coins/claim-quiz", { quiz_id: quizId }).then(setCoins),
  /** Only works when the server runs with DEMO_MODE=true (404 otherwise). */
  demoTopup: (amount = 500) => http.post<CoinsOut>("me/coins/demo-topup", { amount }).then(setCoins),
};

function setCoins(c: CoinsOut) {
  setState((s) => ({ coins: c.coins, serverCoins: c.coins, unlimitedCoins: false, ...(s.homeMeta ? { homeMeta: { ...s.homeMeta, coins: c.coins } } : {}) }));
  return c;
}
