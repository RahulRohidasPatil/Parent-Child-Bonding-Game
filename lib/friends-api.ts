/**
 * Typed browser client for friends and friend duels (route handlers in app/api/friends and
 * app/api/challenges, backed by lib/server/social.ts). Types mirror that module.
 */
import type { PublicQuestion } from "./learn-api";
import type { AvatarId } from "./qn-data";

export type Person = { id: string; username: string | null; name: string; avatar: AvatarId };
export type ChallengeStatus = "your-turn" | "waiting" | "done" | "declined";
export type ChallengeSummary = {
  id: string;
  sentByMe: boolean;
  opponent: Person;
  lessonTitle: string;
  total: number;
  createdAt: number;
  status: ChallengeStatus;
  myScore: number | null;
  theirScore: number | null;
};
export type FriendsSnapshot = {
  me: Person;
  friends: (Person & { since: number })[];
  incoming: { id: string; from: Person; at: number }[];
  outgoing: { id: string; to: Person; at: number }[];
  challenges: ChallengeSummary[];
};
export type DuelResult = { index: number; choice: number; correct: boolean; answer_index: number; explanation: string };
export type DuelSheet = { score: number; total: number; results: DuelResult[] };
export type ChallengeView = {
  id: string;
  title: string;
  lessonTitle: string;
  createdAt: number;
  sentByMe: boolean;
  me: Person;
  opponent: Person;
  status: ChallengeStatus;
  questions: PublicQuestion[];
  mine: DuelSheet | null;
  theirs: DuelSheet | null;
};

export class FriendsError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, {
      ...rest,
      cache: "no-store",
      ...(json !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(json) } : {}),
    });
  } catch {
    throw new FriendsError(0, "You seem to be offline. Check your connection and try again.");
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign(new URL(`/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin));
  }
  if (!res.ok) {
    let detail = "";
    try {
      const b = await res.json();
      if (typeof b?.detail === "string") detail = b.detail;
    } catch {
      /* not JSON */
    }
    throw new FriendsError(res.status, detail || "Something went wrong. Try again.");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const friendsApi = {
  snapshot: () => call<FriendsSnapshot>("friends"),
  /** Adds them straight away if they had already sent you a request. */
  add: (username: string) => call<{ outcome: "sent" | "accepted"; person: Person }>("friends", { method: "POST", json: { username } }),
  answer: (requestId: string, action: "accept" | "decline" | "cancel") =>
    call<void>(`friends/requests/${encodeURIComponent(requestId)}`, { method: "POST", json: { action } }),
  remove: (userId: string) => call<void>(`friends/${encodeURIComponent(userId)}`, { method: "DELETE" }),
  setLook: (avatar: AvatarId) => call<void>("friends/profile", { method: "POST", json: { avatar } }),

  challenge: (friendId: string, tournamentId: string, lessonTitle: string) =>
    call<{ id: string }>("challenges", { method: "POST", json: { friendId, tournamentId, lessonTitle } }),
  getChallenge: (id: string) => call<ChallengeView>(`challenges/${encodeURIComponent(id)}`),
  submit: (id: string, answers: number[]) => call<ChallengeView>(`challenges/${encodeURIComponent(id)}/submit`, { method: "POST", json: { answers } }),
  decline: (id: string) => call<void>(`challenges/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
