import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { auth, clerkClient, type User as ClerkUser } from "@clerk/nextjs/server";
import type { PublicQuestion } from "@/lib/learn-api";
import { AVATARS, type AvatarId } from "@/lib/qn-data";

/**
 * Friends, friend requests and friend duels, kept by this Next.js server until the backend
 * has social endpoints. Users are the Clerk accounts (created by hand for the demo), found
 * by username. Everything else lives in one JSON file, so run a single server instance.
 */

const FILE = process.env.SOCIAL_DATA_FILE || path.join(process.cwd(), ".data", "social.json");
const MAX_CHALLENGES = 500;

export type Person = { id: string; username: string | null; name: string; avatar: AvatarId };

type FriendRequest = { id: string; from: string; to: string; at: number };
type Friendship = { a: string; b: string; since: number };
type KeyItem = { answer_index: number; explanation: string };
export type Sheet = { answers: number[]; at: number };
type StoredChallenge = {
  id: string;
  from: string;
  to: string;
  lessonTitle: string;
  title: string;
  createdAt: number;
  declined: boolean;
  questions: PublicQuestion[];
  key: KeyItem[];
  sheets: Record<string, Sheet>;
};
type Data = {
  requests: FriendRequest[];
  friendships: Friendship[];
  profiles: Record<string, { avatar: AvatarId }>;
  challenges: StoredChallenge[];
};

export class SocialError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** JSON reply for a route handler; `SocialError`s become their status and message. */
export async function respond(fn: () => Promise<unknown>, status = 200): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  try {
    const body = await fn();
    return body === null ? new Response(null, { status: 204, headers }) : Response.json(body, { status, headers });
  } catch (err) {
    if (err instanceof SocialError) return Response.json({ detail: err.message }, { status: err.status, headers });
    console.error("friends:", err);
    return Response.json({ detail: "Something went wrong. Try again." }, { status: 500, headers });
  }
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw new SocialError(400, "Bad request.");
}

// ---------- storage ----------

let queue: Promise<unknown> = Promise.resolve();

async function readData(): Promise<Data> {
  try {
    const saved = JSON.parse(await readFile(/*turbopackIgnore: true*/ FILE, "utf8")) as Partial<Data>;
    return { requests: [], friendships: [], profiles: {}, challenges: [], ...saved };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { requests: [], friendships: [], profiles: {}, challenges: [] };
    throw err;
  }
}

/** Runs `fn` on the stored data, one call at a time; writes only if `fn` returns `write: true`. */
function withData<T>(fn: (data: Data) => { result: T; write?: boolean } | Promise<{ result: T; write?: boolean }>): Promise<T> {
  const run = queue.then(async () => {
    const data = await readData();
    const { result, write } = await fn(data);
    if (write) {
      await mkdir(/*turbopackIgnore: true*/ path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(data));
      await rename(/*turbopackIgnore: true*/ tmp, FILE);
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ---------- people (Clerk) ----------

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new SocialError(401, "Please log in again.");
  return userId;
}

function nameOf(u: ClerkUser): string {
  const meta = (u.unsafeMetadata || {}) as Record<string, unknown>;
  if (typeof meta.display_name === "string" && meta.display_name.trim()) return meta.display_name.trim();
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Friend";
}

function toPerson(u: ClerkUser, data: Data): Person {
  return { id: u.id, username: u.username, name: nameOf(u), avatar: data.profiles[u.id]?.avatar ?? "nova" };
}

async function findByUsername(username: string): Promise<ClerkUser | null> {
  const client = await clerkClient();
  // The filter is a case-insensitive partial match, so pick the exact username.
  const { data } = await client.users.getUserList({ username: [username], limit: 20 });
  return data.find((u) => u.username?.toLowerCase() === username.toLowerCase()) ?? null;
}

async function peopleById(ids: string[], data: Data): Promise<Map<string, Person>> {
  const unique = [...new Set(ids)];
  const out = new Map<string, Person>();
  if (unique.length === 0) return out;
  const client = await clerkClient();
  for (let i = 0; i < unique.length; i += 100) {
    const { data: users } = await client.users.getUserList({ userId: unique.slice(i, i + 100), limit: 100 });
    users.forEach((u) => out.set(u.id, toPerson(u, data)));
  }
  // Accounts deleted in Clerk still show up in old challenges.
  unique.forEach((id) => out.has(id) || out.set(id, { id, username: null, name: "Former player", avatar: "nova" }));
  return out;
}

const areFriends = (data: Data, x: string, y: string) => data.friendships.some((f) => (f.a === x && f.b === y) || (f.a === y && f.b === x));

// ---------- friends ----------

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
  theirScore: number | null; // only once both have played
};
export type FriendsSnapshot = {
  me: Person;
  friends: (Person & { since: number })[];
  incoming: { id: string; from: Person; at: number }[];
  outgoing: { id: string; to: Person; at: number }[];
  challenges: ChallengeSummary[];
};

function statusFor(c: StoredChallenge, me: string): ChallengeStatus {
  if (c.declined) return "declined";
  const other = c.from === me ? c.to : c.from;
  if (!c.sheets[me]) return "your-turn";
  return c.sheets[other] ? "done" : "waiting";
}

const scoreOf = (c: StoredChallenge, sheet: Sheet | undefined) =>
  sheet ? sheet.answers.reduce((n, choice, i) => n + (choice === c.key[i].answer_index ? 1 : 0), 0) : null;

export async function snapshot(me: string): Promise<FriendsSnapshot> {
  const data = await withData((d) => ({ result: d }));
  const friendships = data.friendships.filter((f) => f.a === me || f.b === me);
  const incoming = data.requests.filter((r) => r.to === me);
  const outgoing = data.requests.filter((r) => r.from === me);
  const challenges = data.challenges.filter((c) => c.from === me || c.to === me).slice(-40).reverse();
  const people = await peopleById(
    [me, ...friendships.map((f) => (f.a === me ? f.b : f.a)), ...incoming.map((r) => r.from), ...outgoing.map((r) => r.to), ...challenges.flatMap((c) => [c.from, c.to])],
    data,
  );
  return {
    me: people.get(me)!,
    friends: friendships
      .map((f) => ({ ...people.get(f.a === me ? f.b : f.a)!, since: f.since }))
      .sort((x, y) => x.name.localeCompare(y.name)),
    incoming: incoming.map((r) => ({ id: r.id, from: people.get(r.from)!, at: r.at })),
    outgoing: outgoing.map((r) => ({ id: r.id, to: people.get(r.to)!, at: r.at })),
    challenges: challenges.map((c) => {
      const other = c.from === me ? c.to : c.from;
      const status = statusFor(c, me);
      return {
        id: c.id,
        sentByMe: c.from === me,
        opponent: people.get(other)!,
        lessonTitle: c.lessonTitle,
        total: c.questions.length,
        createdAt: c.createdAt,
        status,
        myScore: scoreOf(c, c.sheets[me]),
        theirScore: status === "done" ? scoreOf(c, c.sheets[other]) : null,
      };
    }),
  };
}

/** Sends a request, or accepts theirs straight away if they already asked. */
export async function sendRequest(me: string, rawUsername: string): Promise<{ outcome: "sent" | "accepted"; person: Person }> {
  const username = rawUsername.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_.-]{1,64}$/.test(username)) throw new SocialError(422, "Enter a username, like zara_k.");
  const target = await findByUsername(username);
  if (!target) throw new SocialError(404, `No one has the username “${username}”. Check the spelling.`);
  if (target.id === me) throw new SocialError(422, "That’s your own username.");
  return withData<{ outcome: "sent" | "accepted"; person: Person }>((data) => {
    const person = toPerson(target, data);
    if (areFriends(data, me, target.id)) throw new SocialError(409, `You and ${person.name} are already friends.`);
    if (data.requests.some((r) => r.from === me && r.to === target.id)) throw new SocialError(409, `You already sent ${person.name} a request.`);
    const theirs = data.requests.find((r) => r.from === target.id && r.to === me);
    if (theirs) {
      data.requests = data.requests.filter((r) => r !== theirs);
      data.friendships.push({ a: target.id, b: me, since: Date.now() });
      return { result: { outcome: "accepted", person }, write: true };
    }
    data.requests.push({ id: randomUUID(), from: me, to: target.id, at: Date.now() });
    return { result: { outcome: "sent", person }, write: true };
  });
}

export function answerRequest(me: string, id: string, action: "accept" | "decline" | "cancel") {
  return withData((data) => {
    const req = data.requests.find((r) => r.id === id);
    const mine = req && (action === "cancel" ? req.from === me : req.to === me);
    if (!req || !mine) throw new SocialError(404, "That request is no longer there.");
    data.requests = data.requests.filter((r) => r !== req);
    if (action === "accept" && !areFriends(data, req.from, req.to)) data.friendships.push({ a: req.from, b: req.to, since: Date.now() });
    return { result: null, write: true };
  });
}

export function removeFriend(me: string, other: string) {
  return withData((data) => {
    const before = data.friendships.length;
    data.friendships = data.friendships.filter((f) => !((f.a === me && f.b === other) || (f.a === other && f.b === me)));
    return { result: null, write: data.friendships.length !== before };
  });
}

export async function setAvatar(me: string, avatar: string) {
  if (!AVATARS.some((a) => a.id === avatar)) throw new SocialError(422, "Unknown look.");
  return withData((data) => {
    if (data.profiles[me]?.avatar === avatar) return { result: null };
    data.profiles[me] = { avatar: avatar as AvatarId };
    return { result: null, write: true };
  });
}

// ---------- duels ----------

export type ReviewedQuestion = { index: number; options: string[]; answer: string; explanation: string };
export type DuelResult = { index: number; choice: number; correct: boolean; answer_index: number; explanation: string };
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
  mine: { score: number; total: number; results: DuelResult[] } | null;
  theirs: { score: number; total: number; results: DuelResult[] } | null; // only once both have played
};

function resultsOf(c: StoredChallenge, sheet: Sheet) {
  const results = sheet.answers.map((choice, i) => ({ index: c.questions[i].index, choice, correct: choice === c.key[i].answer_index, ...c.key[i] }));
  return { score: results.filter((r) => r.correct).length, total: results.length, results };
}

async function viewOf(c: StoredChallenge, me: string, data: Data): Promise<ChallengeView> {
  const other = c.from === me ? c.to : c.from;
  const people = await peopleById([me, other], data);
  const status = statusFor(c, me);
  return {
    id: c.id,
    title: c.title,
    lessonTitle: c.lessonTitle,
    createdAt: c.createdAt,
    sentByMe: c.from === me,
    me: people.get(me)!,
    opponent: people.get(other)!,
    status,
    questions: c.questions,
    mine: c.sheets[me] ? resultsOf(c, c.sheets[me]) : null,
    theirs: status === "done" ? resultsOf(c, c.sheets[other]) : null,
  };
}

/**
 * Stores a duel built from the sender's tournament. The answer key comes from the owner-only
 * review endpoint and never leaves this server until a player has submitted.
 */
export async function createChallenge(
  me: string,
  input: { friendId: string; lessonTitle: string; quiz: { title: string; questions: PublicQuestion[] }; review: ReviewedQuestion[] },
): Promise<string> {
  const byIndex = new Map(input.review.map((q) => [q.index, q]));
  const questions: PublicQuestion[] = [];
  const key: KeyItem[] = [];
  for (const q of input.quiz.questions) {
    const r = byIndex.get(q.index);
    const answer = r ? q.options.findIndex((o) => o.trim().toLowerCase() === r.answer.trim().toLowerCase()) : -1;
    if (!r || answer < 0 || q.options.length < 2) continue; // can't be scored here
    questions.push(q);
    key.push({ answer_index: answer, explanation: r.explanation });
  }
  if (questions.length === 0) throw new SocialError(502, "Those questions can’t be used for a friend duel. Try again.");
  return withData((data) => {
    if (!areFriends(data, me, input.friendId)) throw new SocialError(403, "You can only challenge your friends.");
    const id = randomUUID();
    data.challenges.push({
      id,
      from: me,
      to: input.friendId,
      lessonTitle: input.lessonTitle.slice(0, 120) || "a lesson",
      title: input.quiz.title,
      createdAt: Date.now(),
      declined: false,
      questions,
      key,
      sheets: {},
    });
    data.challenges = data.challenges.slice(-MAX_CHALLENGES);
    return { result: id, write: true };
  });
}

function findChallenge(data: Data, id: string, me: string): StoredChallenge {
  const c = data.challenges.find((x) => x.id === id);
  if (!c || (c.from !== me && c.to !== me)) throw new SocialError(404, "That duel isn’t there any more.");
  return c;
}

export async function getChallenge(me: string, id: string): Promise<ChallengeView> {
  const data = await withData((d) => ({ result: d }));
  return viewOf(findChallenge(data, id, me), me, data);
}

export async function submitChallenge(me: string, id: string, answers: unknown): Promise<ChallengeView> {
  const data = await withData((d) => {
    const c = findChallenge(d, id, me);
    if (c.declined) throw new SocialError(409, "This duel was called off.");
    if (c.sheets[me]) return { result: d }; // already played: show the saved result
    const ok =
      Array.isArray(answers) &&
      answers.length === c.questions.length &&
      answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < c.questions[i].options.length);
    if (!ok) throw new SocialError(422, "Answer every question once.");
    c.sheets[me] = { answers: answers as number[], at: Date.now() };
    return { result: d, write: true };
  });
  return viewOf(findChallenge(data, id, me), me, data);
}

/** The friend declines, or the sender calls it off; only before the friend has played. */
export function declineChallenge(me: string, id: string) {
  return withData((data) => {
    const c = findChallenge(data, id, me);
    if (c.sheets[c.to]) throw new SocialError(409, "This duel has already been played.");
    c.declined = true;
    return { result: null, write: true };
  });
}
