/**
 * Typed browser client for friends, presence and live duels (docs/SOCIAL_API.md), called through
 * the same-origin proxy at /api/social/*. The proxy adds the Clerk token for the backend.
 */
import type { PublicQuestion } from "./learn-api";
import type { AvatarId } from "./qn-data";

export type PublicUser = { id: string; username: string; display_name: string; avatar: AvatarId; online: boolean | null; busy: boolean | null };
export type Relationship = "none" | "friend" | "request_sent" | "request_received";
export type FriendRequest = { id: string; from: PublicUser; to: PublicUser; created_at: string };
export type Friends = { friends: (PublicUser & { since: string })[]; incoming: FriendRequest[]; outgoing: FriendRequest[] };
export type DuelStatus = "invited" | "declined" | "expired" | "cancelled" | "active" | "finished";
export type DuelResult = { index: number; choice: number | null; correct: boolean; answer_index: number; explanation: string };
export type DuelSheet = { score: number; total: number; results: DuelResult[] };
export type Duel = {
  id: string;
  status: DuelStatus;
  my_role: "challenger" | "opponent";
  challenger: PublicUser;
  opponent: PublicUser;
  lesson_title: string;
  num_questions: number;
  created_at: string;
  invite_expires_at: string;
  start_at: string | null;
  ends_at: string | null;
  server_now: string;
  questions: PublicQuestion[] | null;
  progress: { me: number; opponent: number };
  results: { me: DuelSheet; opponent: DuelSheet; winner: "me" | "opponent" | "draw" } | null;
};
export type Presence = { heartbeat_s: number; online_window_s: number; invites: Duel[] };

export class SocialError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: { method?: string; json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/social/${path}`, {
      method: init?.method ?? "GET",
      cache: "no-store",
      ...(init?.json !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(init.json) } : {}),
    });
  } catch {
    throw new SocialError(0, "You seem to be offline. Check your connection and try again.");
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign(new URL(`/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin));
  }
  if (!res.ok) {
    let detail = "";
    let code: string | undefined;
    try {
      const b = await res.json();
      if (typeof b?.detail === "string") detail = b.detail;
      if (typeof b?.code === "string") code = b.code;
    } catch {
      /* not JSON */
    }
    throw new SocialError(res.status, detail || "Something went wrong. Try again.", code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const id = encodeURIComponent;

export const socialApi = {
  saveMe: (me: { display_name: string; avatar: AvatarId; role: "learner" | "parent" }) => call<unknown>("me", { method: "PUT", json: me }),
  presence: (state: "online" | "offline" = "online") => call<Presence>("presence", { method: "POST", json: { state } }),
  /** Best effort when the tab closes: a beacon still carries the session cookie to the proxy. */
  leave: () => {
    try {
      navigator.sendBeacon("/api/social/presence", new Blob([JSON.stringify({ state: "offline" })], { type: "application/json" }));
    } catch {
      /* fine: presence runs out by itself */
    }
  },
  search: (q: string, limit = 10) => call<{ users: (PublicUser & { relationship: Relationship })[] }>(`users/search?q=${id(q)}&limit=${limit}`),
  friends: (onlineOnly = false) => call<Friends>(`friends${onlineOnly ? "?online=true" : ""}`),
  request: (username: string) =>
    call<{ status: "sent"; request: FriendRequest } | { status: "accepted"; friend: PublicUser }>("friend-requests", { method: "POST", json: { username } }),
  accept: (requestId: string) => call<{ friend: PublicUser }>(`friend-requests/${id(requestId)}/accept`, { method: "POST" }),
  decline: (requestId: string) => call<void>(`friend-requests/${id(requestId)}/decline`, { method: "POST" }),
  cancelRequest: (requestId: string) => call<void>(`friend-requests/${id(requestId)}`, { method: "DELETE" }),
  unfriend: (userId: string) => call<void>(`friends/${id(userId)}`, { method: "DELETE" }),

  createDuel: (opponent_id: string, lesson_id: string, num_questions: number) => call<Duel>("duels", { method: "POST", json: { opponent_id, lesson_id, num_questions } }),
  currentDuel: () => call<Duel>("duels/current"),
  duel: (duelId: string) => call<Duel>(`duels/${id(duelId)}`),
  acceptDuel: (duelId: string) => call<Duel>(`duels/${id(duelId)}/accept`, { method: "POST" }),
  declineDuel: (duelId: string) => call<Duel>(`duels/${id(duelId)}/decline`, { method: "POST" }),
  cancelDuel: (duelId: string) => call<Duel>(`duels/${id(duelId)}/cancel`, { method: "POST" }),
  answer: (duelId: string, index: number, choice: number) => call<{ answered: number }>(`duels/${id(duelId)}/answers`, { method: "POST", json: { index, choice } }),
};

/** Milliseconds until `at`, on the server's clock (`server_now` corrects for a phone's clock drift). */
export function msUntil(at: string | null, duel: Pick<Duel, "server_now">, fetchedAt: number): number {
  if (!at) return 0;
  const skew = Date.parse(duel.server_now) - fetchedAt;
  return Date.parse(at) - (Date.now() + skew);
}
