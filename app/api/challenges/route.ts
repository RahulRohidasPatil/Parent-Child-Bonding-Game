import type { PublicQuiz } from "@/lib/learn-api";
import { type LearningSession, LearningUnavailable, learningFetch, learningSession } from "@/lib/server/learning-session";
import { readDetail } from "@/lib/server/session";
import { type ReviewedQuestion, SocialError, createChallenge, readJson, requireUserId, respond } from "@/lib/server/social";

async function fromLearning<T>(path: string, session: LearningSession): Promise<T> {
  let res: Response;
  try {
    res = await learningFetch(session, path);
  } catch (err) {
    if (!(err instanceof LearningUnavailable)) throw err;
    throw new SocialError(503, "Can’t reach the learning server. Check that it is running, then try again.");
  }
  if (!res.ok) throw new SocialError(res.status === 404 ? 404 : 502, await readDetail(res, "Couldn’t read the duel questions."));
  return (await res.json()) as T;
}

/**
 * Turn one of your tournaments into a duel with a friend: `{ friendId, tournamentId, lessonTitle }`.
 * Tournaments belong to their creator, so the questions and answers are copied here for the friend.
 */
export async function POST(req: Request) {
  return respond(async () => {
    const me = await requireUserId();
    const { friendId, tournamentId, lessonTitle } = await readJson(req);
    if (typeof friendId !== "string" || typeof tournamentId !== "string" || !/^[\w-]{1,64}$/.test(tournamentId)) {
      throw new SocialError(422, "Pick a friend and a lesson.");
    }
    const session = await learningSession();
    if (!session) throw new SocialError(401, "Please log in again.");
    const id = encodeURIComponent(tournamentId);
    const [quiz, review] = await Promise.all([
      fromLearning<PublicQuiz>(`tournament/${id}`, session),
      fromLearning<{ questions: ReviewedQuestion[] }>(`tournament/${id}/review`, session),
    ]);
    const challengeId = await createChallenge(me, {
      friendId,
      lessonTitle: typeof lessonTitle === "string" ? lessonTitle : quiz.title,
      quiz,
      review: review.questions,
    });
    return { id: challengeId };
  }, 201);
}
