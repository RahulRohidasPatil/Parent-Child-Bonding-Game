import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PublicQuestion } from "@/lib/learn-api";
import { AVATARS, type AvatarId } from "@/lib/qn-data";

/**
 * Local stand-in for the backend's friends, presence and live-duel API (docs/SOCIAL_API.md),
 * used until the backend ships it (`SOCIAL_API=backend` switches over). Same paths, bodies and
 * errors as the contract; data lives in one JSON file, so run a single server instance.
 */

export const LIMITS = { heartbeat_s: 20, online_window_s: 45, invite_ttl_s: 30, start_delay_s: 5, seconds_per_question: 20 };
export const clock = { now: () => Date.now() }; // replaceable in tests

const FILE = process.env.SOCIAL_DATA_FILE || path.join(process.cwd(), ".data", "social.json");
const KEEP_DUELS = 500;
const USERNAME = /^[A-Za-z0-9_.-]{1,64}$/;

type Role = "learner" | "parent";
type UserRow = { id: string; username: string; display_name: string; avatar: AvatarId; role: Role; last_seen: number | null; created_at: number };
type RequestRow = { id: string; from: string; to: string; at: number };
type Friendship = { a: string; b: string; since: number };
type KeyItem = { answer_index: number; explanation: string };
type DuelStatus = "invited" | "declined" | "expired" | "cancelled" | "active" | "finished";
type DuelRow = {
  id: string;
  challenger: string;
  opponent: string;
  lesson_title: string;
  status: DuelStatus;
  created_at: number;
  invite_expires_at: number;
  start_at: number | null;
  ends_at: number | null;
  questions: PublicQuestion[];
  key: KeyItem[];
  answers: Record<string, Record<number, number>>; // user id -> question index -> choice
};
type Data = { users: Record<string, UserRow>; requests: RequestRow[]; friendships: Friendship[]; duels: DuelRow[] };

export type QuestionSet = { title: string; questions: PublicQuestion[]; key: KeyItem[] };
/** Writes the duel's questions from the challenger's lesson (the backend does this itself). */
export type MakeQuestions = (lessonId: string, numQuestions: number) => Promise<QuestionSet>;

export class SocialError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

// ---------- storage ----------

let queue: Promise<unknown> = Promise.resolve();

async function readData(): Promise<Data> {
  let saved: Partial<Data> & { profiles?: Record<string, { avatar: AvatarId }> } = {};
  try {
    saved = JSON.parse(await readFile(/*turbopackIgnore: true*/ FILE, "utf8"));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  // Friendships and requests from the first version carry over; its duels don't.
  return { users: saved.users ?? {}, requests: saved.requests ?? [], friendships: saved.friendships ?? [], duels: saved.duels ?? [] };
}

/** Runs `fn` on the stored data, one call at a time, and saves it if anything changed. */
function withData<T>(fn: (data: Data, now: number) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await readData();
    const before = JSON.stringify(data);
    const now = clock.now();
    settle(data, now);
    const result = await fn(data, now);
    const after = JSON.stringify(data);
    if (after !== before) {
      await mkdir(/*turbopackIgnore: true*/ path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(/*turbopackIgnore: true*/ tmp, after);
      await rename(/*turbopackIgnore: true*/ tmp, FILE);
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ---------- rules ----------

const iso = (t: number | null) => (t === null ? null : new Date(t).toISOString());
const areFriends = (d: Data, x: string, y: string) => d.friendships.some((f) => (f.a === x && f.b === y) || (f.a === y && f.b === x));
const isOnline = (u: UserRow | undefined, now: number) => !!u?.last_seen && now - u.last_seen < LIMITS.online_window_s * 1000;
const isBusy = (d: Data, id: string) => d.duels.some((x) => (x.status === "invited" || x.status === "active") && (x.challenger === id || x.opponent === id));
const answeredAll = (x: DuelRow, id: string) => Object.keys(x.answers[id] ?? {}).length >= x.questions.length;

/** Expire old invites and finish duels that are over (the contract does this on read). */
function settle(d: Data, now: number) {
  for (const x of d.duels) {
    if (x.status === "invited" && now >= x.invite_expires_at) x.status = "expired";
    if (x.status === "active" && (now >= x.ends_at! || (answeredAll(x, x.challenger) && answeredAll(x, x.opponent)))) x.status = "finished";
  }
}

function publicUser(d: Data, id: string, viewer: string, now: number) {
  const u = d.users[id];
  const friend = id !== viewer && areFriends(d, viewer, id);
  return {
    id,
    username: u?.username ?? "unknown",
    display_name: u?.display_name ?? "Friend",
    avatar: u?.avatar ?? "nova",
    online: friend ? isOnline(u, now) : null,
    busy: friend ? isBusy(d, id) : null,
  };
}

function requestView(d: Data, r: RequestRow, viewer: string, now: number) {
  return { id: r.id, from: publicUser(d, r.from, viewer, now), to: publicUser(d, r.to, viewer, now), created_at: iso(r.at) };
}

function sheet(x: DuelRow, id: string) {
  const mine = x.answers[id] ?? {};
  const results = x.questions.map((q, i) => {
    const choice = mine[i] ?? null;
    return { index: q.index, choice, correct: choice === x.key[i].answer_index, ...x.key[i] };
  });
  return { score: results.filter((r) => r.correct).length, total: results.length, results };
}

function duelView(d: Data, x: DuelRow, viewer: string, now: number) {
  const other = x.challenger === viewer ? x.opponent : x.challenger;
  const started = (x.status === "active" || x.status === "finished") && x.start_at !== null && now >= x.start_at;
  let results = null;
  if (x.status === "finished") {
    const me = sheet(x, viewer);
    const them = sheet(x, other);
    results = { me, opponent: them, winner: me.score === them.score ? "draw" : me.score > them.score ? "me" : "opponent" };
  }
  return {
    id: x.id,
    status: x.status,
    my_role: x.challenger === viewer ? "challenger" : "opponent",
    challenger: publicUser(d, x.challenger, viewer, now),
    opponent: publicUser(d, x.opponent, viewer, now),
    lesson_title: x.lesson_title,
    num_questions: x.questions.length,
    created_at: iso(x.created_at),
    invite_expires_at: iso(x.invite_expires_at),
    start_at: iso(x.start_at),
    ends_at: iso(x.ends_at),
    server_now: iso(now),
    questions: started ? x.questions : null,
    progress: { me: Object.keys(x.answers[viewer] ?? {}).length, opponent: Object.keys(x.answers[other] ?? {}).length },
    results,
  };
}

function findDuel(d: Data, id: string, viewer: string) {
  const x = d.duels.find((y) => y.id === id);
  if (!x || (x.challenger !== viewer && x.opponent !== viewer)) throw new SocialError(404, "That duel isn’t there any more.");
  return x;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

// ---------- endpoints ----------

export type Ctx = { me: string; username: string | null; makeQuestions: MakeQuestions };
export type Reply = { status: number; body: unknown };
const ok = (body: unknown, status = 200): Reply => ({ status, body });

/** One contract call: `segments` is the path after `/api/social/`. Throws `SocialError` for contract errors. */
export async function handle(method: string, segments: string[], query: URLSearchParams, body: Record<string, unknown>, ctx: Ctx): Promise<Reply> {
  const { me } = ctx;
  const route = `${method} ${segments.map((s, i) => (i > 0 && /^(friend-requests|friends|duels)$/.test(segments[i - 1]) && s !== "current" ? ":id" : s)).join("/")}`;
  const id = segments[1];

  switch (route) {
    case "PUT me": {
      if (!ctx.username) throw new SocialError(422, "Your account has no username yet, so friends can’t find you.", "no_username");
      const avatar = str(body.avatar);
      if (!AVATARS.some((a) => a.id === avatar)) throw new SocialError(422, "Unknown look.");
      const role: Role = body.role === "parent" ? "parent" : "learner";
      const display_name = str(body.display_name).trim().slice(0, 60) || ctx.username;
      return withData((d, now) => {
        const prev = d.users[me];
        d.users[me] = { id: me, username: ctx.username!, display_name, avatar: avatar as AvatarId, role, last_seen: prev?.last_seen ?? null, created_at: prev?.created_at ?? now };
        return ok({ id: me, username: ctx.username, display_name, avatar, role });
      });
    }

    case "POST presence":
      return withData((d, now) => {
        const u = d.users[me];
        if (u) u.last_seen = body.state === "offline" ? null : now;
        const invites = d.duels.filter((x) => x.opponent === me && x.status === "invited").map((x) => duelView(d, x, me, now));
        return ok({ heartbeat_s: LIMITS.heartbeat_s, online_window_s: LIMITS.online_window_s, invites });
      });

    case "GET users/search": {
      const q = (query.get("q") ?? "").trim().replace(/^@/, "").toLowerCase();
      if (q.length < 2) throw new SocialError(422, "Type at least 2 letters of the username.");
      const limit = Math.min(20, Math.max(1, Number(query.get("limit")) || 10));
      return withData((d, now) =>
        ok({
          users: Object.values(d.users)
            .filter((u) => u.id !== me && u.username.toLowerCase().startsWith(q))
            .sort((a, b) => a.username.localeCompare(b.username))
            .slice(0, limit)
            .map((u) => ({
              ...publicUser(d, u.id, me, now),
              relationship: areFriends(d, me, u.id)
                ? "friend"
                : d.requests.some((r) => r.from === me && r.to === u.id)
                  ? "request_sent"
                  : d.requests.some((r) => r.from === u.id && r.to === me)
                    ? "request_received"
                    : "none",
            })),
        }),
      );
    }

    case "GET friends":
      return withData((d, now) => {
        let friends = d.friendships
          .filter((f) => f.a === me || f.b === me)
          .map((f) => ({ ...publicUser(d, f.a === me ? f.b : f.a, me, now), since: iso(f.since) }));
        if (query.get("online") === "true") friends = friends.filter((f) => f.online);
        friends.sort((x, y) => Number(y.online) - Number(x.online) || x.display_name.localeCompare(y.display_name));
        return ok({
          friends,
          incoming: d.requests.filter((r) => r.to === me).map((r) => requestView(d, r, me, now)),
          outgoing: d.requests.filter((r) => r.from === me).map((r) => requestView(d, r, me, now)),
        });
      });

    case "POST friend-requests": {
      const username = str(body.username).trim().replace(/^@/, "");
      if (!USERNAME.test(username)) throw new SocialError(422, "Enter a username, like zara_k.");
      return withData((d, now) => {
        const target = Object.values(d.users).find((u) => u.username.toLowerCase() === username.toLowerCase());
        if (!target) throw new SocialError(404, `No one has the username “${username}”. Check the spelling.`);
        if (target.id === me) throw new SocialError(422, "That’s your own username.");
        if (areFriends(d, me, target.id)) throw new SocialError(409, `You and ${target.display_name} are already friends.`);
        if (d.requests.some((r) => r.from === me && r.to === target.id)) throw new SocialError(409, `You already sent ${target.display_name} a request.`);
        const theirs = d.requests.find((r) => r.from === target.id && r.to === me);
        if (theirs) {
          d.requests = d.requests.filter((r) => r !== theirs);
          d.friendships.push({ a: target.id, b: me, since: now });
          return ok({ status: "accepted", friend: publicUser(d, target.id, me, now) });
        }
        const r = { id: `req_${randomUUID()}`, from: me, to: target.id, at: now };
        d.requests.push(r);
        return ok({ status: "sent", request: requestView(d, r, me, now) }, 201);
      });
    }

    case "POST friend-requests/:id/accept":
    case "POST friend-requests/:id/decline":
    case "DELETE friend-requests/:id":
      return withData((d, now) => {
        const r = d.requests.find((x) => x.id === id);
        const allowed = r && (method === "DELETE" ? r.from === me : r.to === me);
        if (!r || !allowed) throw new SocialError(404, "That request is no longer there.");
        d.requests = d.requests.filter((x) => x !== r);
        if (segments[2] !== "accept") return ok(null, 204);
        if (!areFriends(d, r.from, r.to)) d.friendships.push({ a: r.from, b: r.to, since: now });
        return ok({ friend: publicUser(d, r.from, me, now) });
      });

    case "DELETE friends/:id":
      return withData((d) => {
        d.friendships = d.friendships.filter((f) => !((f.a === me && f.b === id) || (f.a === id && f.b === me)));
        return ok(null, 204);
      });

    case "POST duels": {
      const opponentId = str(body.opponent_id);
      const lessonId = str(body.lesson_id);
      const n = Number(body.num_questions);
      if (!Number.isInteger(n) || n < 3 || n > 8) throw new SocialError(422, "Pick 3 to 8 questions.");
      if (!lessonId) throw new SocialError(422, "Pick a lesson.");
      const check = (d: Data, now: number) => {
        if (!areFriends(d, me, opponentId)) throw new SocialError(403, "You can only challenge your friends.");
        const them = d.users[opponentId];
        if (!isOnline(them, now)) throw new SocialError(409, `${them?.display_name ?? "Your friend"} is offline right now.`, "offline");
        if (isBusy(d, opponentId)) throw new SocialError(409, `${them.display_name} is in another duel.`, "busy");
        if (isBusy(d, me)) throw new SocialError(409, "Finish your other duel first.", "busy");
      };
      await withData(check); // fail fast, before 20–40 s of question writing
      const set = await ctx.makeQuestions(lessonId, n);
      if (set.questions.length === 0) throw new SocialError(502, "Those questions can’t be used for a duel. Try again.");
      return withData((d, now) => {
        check(d, now); // still online and free after the wait?
        const x: DuelRow = {
          id: `duel_${randomUUID()}`,
          challenger: me,
          opponent: opponentId,
          lesson_title: set.title.slice(0, 120) || "a lesson",
          status: "invited",
          created_at: now,
          invite_expires_at: now + LIMITS.invite_ttl_s * 1000,
          start_at: null,
          ends_at: null,
          questions: set.questions,
          key: set.key,
          answers: {},
        };
        d.duels = [...d.duels, x].slice(-KEEP_DUELS);
        return ok(duelView(d, x, me, now), 201);
      });
    }

    case "GET duels/current":
      return withData((d, now) => {
        const x = d.duels.find((y) => (y.status === "invited" || y.status === "active") && (y.challenger === me || y.opponent === me));
        if (!x) throw new SocialError(404, "No duel right now.");
        return ok(duelView(d, x, me, now));
      });

    case "GET duels/:id":
      return withData((d, now) => ok(duelView(d, findDuel(d, id, me), me, now)));

    case "POST duels/:id/accept":
    case "POST duels/:id/decline":
    case "POST duels/:id/cancel":
      return withData((d, now) => {
        const x = findDuel(d, id, me);
        const action = segments[2];
        const mine = action === "cancel" ? x.challenger === me : x.opponent === me;
        if (!mine) throw new SocialError(403, "That isn’t your duel to answer.");
        if (x.status !== "invited") {
          throw new SocialError(409, x.status === "expired" ? "That invite ran out of time." : x.status === "cancelled" ? "The duel was called off." : "That duel has already been answered.", x.status);
        }
        if (action === "accept") {
          x.status = "active";
          x.start_at = now + LIMITS.start_delay_s * 1000;
          x.ends_at = x.start_at + x.questions.length * LIMITS.seconds_per_question * 1000;
        } else {
          x.status = action === "decline" ? "declined" : "cancelled";
        }
        return ok(duelView(d, x, me, now));
      });

    case "POST duels/:id/answers": {
      const index = Number(body.index);
      const choice = Number(body.choice);
      return withData((d, now) => {
        const x = findDuel(d, id, me);
        if (x.status !== "active" || now < x.start_at! || now >= x.ends_at!) throw new SocialError(409, "This duel isn’t taking answers right now.", x.status);
        if (!Number.isInteger(index) || index < 0 || index >= x.questions.length) throw new SocialError(422, "Unknown question.");
        if (!Number.isInteger(choice) || choice < 0 || choice >= x.questions[index].options.length) throw new SocialError(422, "Unknown answer.");
        const mine = (x.answers[me] ??= {});
        if (mine[index] !== undefined && mine[index] !== choice) throw new SocialError(409, "You already answered that one.");
        mine[index] = choice;
        settle(d, now);
        return ok({ answered: Object.keys(mine).length });
      });
    }
  }
  throw new SocialError(404, "Not found.");
}
