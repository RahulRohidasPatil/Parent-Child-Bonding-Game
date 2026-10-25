import type { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { PublicLesson, PublicQuiz } from "@/lib/learn-api";
import { type LearningSession, LearningUnavailable, forwardToLearning, learningFetch, learningSession } from "@/lib/server/learning-session";
import { readDetail } from "@/lib/server/session";
import { type MakeQuestions, SocialError, handle } from "@/lib/server/social-local";

/**
 * Friends, presence and live duels (docs/SOCIAL_API.md). With `SOCIAL_API=backend` this is a plain
 * proxy to the backend's `/api/social/*`; otherwise the local stand-in answers the same contract.
 */
const USE_BACKEND = process.env.SOCIAL_API === "backend";
const headers = { "Cache-Control": "no-store" };

async function route(req: NextRequest, ctx: RouteContext<"/api/social/[...path]">) {
  const { path } = await ctx.params;
  if (USE_BACKEND) return forwardToLearning(req, `social/${path.map(encodeURIComponent).join("/")}`, req.nextUrl.search);

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) throw new SocialError(401, "Please log in again.");
    const claimed = (sessionClaims as Record<string, unknown> | null)?.username;
    // Only the profile call needs the username; the token has it once the Clerk claim is set up.
    const username = typeof claimed === "string" && claimed ? claimed : path[0] === "me" ? ((await currentUser())?.username ?? null) : null;
    let body: Record<string, unknown> = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const parsed = await req.json();
        if (parsed && typeof parsed === "object") body = parsed;
      } catch {
        throw new SocialError(400, "Bad request.");
      }
    }
    const reply = await handle(req.method, path, req.nextUrl.searchParams, body, { me: userId, username, makeQuestions });
    return reply.status === 204 ? new Response(null, { status: 204, headers }) : Response.json(reply.body, { status: reply.status, headers });
  } catch (err) {
    if (err instanceof SocialError) return Response.json({ detail: err.message, ...(err.code ? { code: err.code } : {}) }, { status: err.status, headers });
    console.error("social:", err);
    return Response.json({ detail: "Something went wrong. Try again." }, { status: 500, headers });
  }
}

async function learning<T>(session: LearningSession, path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await learningFetch(session, path, init);
  } catch (err) {
    if (err instanceof LearningUnavailable) throw new SocialError(503, "Can’t reach the learning server. Check that it is running, then try again.");
    throw err;
  }
  if (!res.ok) throw new SocialError(res.status === 404 ? 404 : 502, await readDetail(res, "Couldn’t write the duel questions."));
  return (await res.json()) as T;
}

/**
 * The stand-in's question writer: a tournament from the challenger's lesson, plus its answer key from
 * the owner-only review endpoint. The answers never leave this server.
 */
const makeQuestions: MakeQuestions = async (lessonId, numQuestions) => {
  const session = await learningSession();
  if (!session) throw new SocialError(401, "Please log in again.");
  const json = { "content-type": "application/json" };
  const id = encodeURIComponent(lessonId);
  const [lesson] = await Promise.all([
    learning<PublicLesson>(session, `lessons/${id}`),
    // Scored question sets need a confirmed lesson; if this fails, creating the tournament says why.
    learningFetch(session, `lessons/${id}/approve`, { method: "POST", headers: json, body: JSON.stringify({ expected_revision: 1, confirmed: true }) }).catch(() => null),
  ]);
  const quiz = await learning<PublicQuiz>(session, "tournament", { method: "POST", headers: json, body: JSON.stringify({ lesson_id: lessonId, num_questions: numQuestions }) });
  const review = await learning<{ questions: { index: number; answer: string; explanation: string }[] }>(session, `tournament/${encodeURIComponent(quiz.id)}/review`);
  const byIndex = new Map(review.questions.map((q) => [q.index, q]));
  const questions: PublicQuestion[] = [];
  const key: { answer_index: number; explanation: string }[] = [];
  for (const q of quiz.questions) {
    const r = byIndex.get(q.index);
    const answer = r ? q.options.findIndex((o) => o.trim().toLowerCase() === r.answer.trim().toLowerCase()) : -1;
    if (!r || answer < 0 || q.options.length < 2) continue; // can't be scored
    questions.push(q);
    key.push({ answer_index: answer, explanation: r.explanation });
  }
  return { title: lesson.title || quiz.title, questions, key };
};

type PublicQuestion = PublicQuiz["questions"][number];

export const GET = route;
export const POST = route;
export const PUT = route;
export const DELETE = route;
