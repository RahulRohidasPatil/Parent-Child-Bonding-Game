/**
 * Typed browser client for the learning service (OpenAPI "Learning Quiz Agent" 0.1.0),
 * called through the same-origin proxy at /api/*.
 */

export type Chapter = { title: string; start: number; end: number };
export type MaterialInfo = {
  id: string;
  name: string;
  kind: "pdf" | "photos";
  page_count: number;
  text_pages: number;
  vision_pages: number;
  blank_pages: number;
  chapters: Chapter[];
  warnings: string[];
};
export type MaterialPage = { number: number; text: string; via: "text" | "vision" | "none" };
export type MaterialPages = { id: string; revision: number; confirmed: boolean; pages: MaterialPage[] };
export type MaterialStatus = { revision: number; confirmed: boolean };
export type FoundPages = {
  pages: number[];
  how: "pages" | "chapter" | "search";
  label: string;
  characters: number;
  truncated: boolean;
  preview: string;
};
export type SectionVisual = { kind: "diagram" | "chart" | "interactive"; purpose: string; brief: string };
export type LessonSection = { heading: string; body: string; visual?: SectionVisual | null };
export type PublicVisual = {
  id: string;
  kind: "diagram" | "chart" | "interactive";
  section_index: number;
  title: string;
  caption: string;
  alt: string;
  html: string;
};
export type LessonSource = { material_id: string; title: string; pages: number[]; label: string; truncated?: boolean };
export type PublicLesson = {
  id: string;
  title: string;
  summary: string;
  sections: LessonSection[];
  key_points: string[];
  topic: string;
  age: number;
  source?: LessonSource | null;
  visuals: PublicVisual[];
  revision?: number;
  status?: string;
};
export type PublicQuestion = {
  index: number;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options: string[];
  visual_html?: string | null;
};
export type PublicQuiz = {
  id: string;
  lesson_id: string;
  title: string;
  dropped: number;
  questions: PublicQuestion[];
  focus?: string[];
  parent_id?: string | null;
};
export type CheckOut = { correct: boolean; answer_index: number; explanation: string; answer_visual_html?: string | null };
export type DeckState = { next: number | null; known: number; total: number; reviews: number; hard: number[] };
export type PublicCard = {
  index: number;
  kind: "concept" | "diagram";
  front: string;
  back: string;
  front_visual_html?: string | null;
  back_visual_html?: string | null;
};
export type PublicDeck = { id: string; lesson_id: string; title: string; cards: PublicCard[]; state: DeckState };
export type ChatOut = { answer: string; used_pdf: boolean; pages: number[]; label: string | null; mode: "auto" | "pdf_only" };
export type TournamentResult = CheckOut & { index: number; choice: number };
export type SubmitOut = { score: number; total: number; results: TournamentResult[] };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const FRIENDLY: Record<number, string> = {
  401: "Your session ended. Please log in again.",
  404: "We couldn’t find that any more. The learning server may have restarted, so start again from Learn.",
  409: "Nothing to practise yet: you haven’t got any answers wrong.",
  413: "That upload is too big. Use up to 20 photos or one PDF under 25 MB.",
  415: "That file type can’t be read. Use a PDF or JPG, PNG or WebP photos.",
  502: "The AI didn’t give a usable answer this time. Try again.",
  503: "Can’t reach the learning server. Check that it is running, then try again.",
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError(0, "You seem to be offline. Check your connection and try again.");
  }
  if (res.status === 401 && typeof window !== "undefined") {
    // Hard navigation on purpose: the session is gone, so drop all client state.
    window.location.assign(new URL(`/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin));
  }
  if (!res.ok) {
    let detail = "";
    try {
      const b = await res.json();
      detail = typeof b?.detail === "string" ? b.detail : Array.isArray(b?.detail) ? String(b.detail[0]?.msg ?? "") : "";
    } catch {
      /* not JSON */
    }
    // 422 carries the useful reason (e.g. "the book doesn't cover that"); others get a friendly line.
    const msg = detail || FRIENDLY[res.status] || "Something went wrong. Try again.";
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const post = <T>(path: string, body: unknown) =>
  call<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const put = <T>(path: string, body: unknown) =>
  call<T>(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

/** Shared JSON transport for the server-owned home, wallet and other app resources. */
export const http = {
  request: call,
  get: <T>(path: string) => call<T>(path),
  post,
  postKey: <T>(path: string, body: unknown, key: string) => call<T>(path, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) }),
  put,
  patch: <T>(path: string, body: unknown) => call<T>(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  del: <T>(path: string) => call<T>(path, { method: "DELETE" }),
};

export const learnApi = {
  uploadMaterial(files: File[]) {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return call<MaterialInfo>("materials", { method: "POST", body: fd });
  },
  getMaterial: (id: string) => call<MaterialInfo>(`materials/${id}`),
  getPages: (id: string) => call<MaterialPages>(`materials/${id}/pages`),
  /** Lessons can only use an upload after its current text revision is confirmed. */
  confirmMaterial: (id: string, expected_revision: number) =>
    post<MaterialStatus>(`materials/${id}/confirm`, { expected_revision, confirmed: true }),
  /** Confirm the latest extracted text if it isn't already, so `createLesson` can use the upload. */
  async ensureConfirmed(id: string): Promise<MaterialStatus> {
    const p = await call<MaterialPages>(`materials/${id}/pages`);
    if (p.confirmed) return { revision: p.revision, confirmed: true };
    return post<MaterialStatus>(`materials/${id}/confirm`, { expected_revision: p.revision, confirmed: true });
  },
  findPages: (id: string, topic: string) => call<FoundPages>(`materials/${id}/find?topic=${encodeURIComponent(topic)}`),
  deleteMaterial: (id: string) => call<void>(`materials/${id}`, { method: "DELETE" }),

  /**
   * `topic` + `age` explains any topic. With `material_id`, `topic` picks the part of the upload:
   * a topic, "chapter 3" or "pages 40-55". `prefers_visuals` asks for a picture in nearly every section.
   */
  createLesson: (body: { topic: string; age: number; material_id?: string | null; prefers_visuals?: boolean }) =>
    post<PublicLesson>("lessons", body),
  getLesson: (id: string) => call<PublicLesson>(`lessons/${id}`),
  /** Scored quizzes (tournaments) need the owner to confirm the lesson first. Lessons made here are revision 1. */
  approveLesson: (id: string, expected_revision = 1) => post<unknown>(`lessons/${id}/approve`, { expected_revision, confirmed: true }),
  drawVisuals: (id: string, ask?: string) => post<{ visuals: PublicVisual[] }>(`lessons/${id}/visuals`, ask ? { ask } : {}),

  /** Free-text answer (message up to 1000 characters). With `material_id` the upload must be confirmed. */
  chat: (body: {
    message: string;
    age: number;
    material_id?: string | null;
    mode?: "auto" | "pdf_only";
    conversation_id?: string;
    history?: { role: "user" | "assistant"; content: string }[]; // stateless: send recent turns, oldest first
  }) => post<ChatOut>("chat", body),

  imageChat: async (file: File, message: string, age: number, conversation_id: string) => {
    const body = new FormData(); body.append("images", file); body.append("message", message); body.append("age", String(age)); body.append("conversation_id", conversation_id);
    const result = await call<{ answer: string }>("chat/image", { method: "POST", body });
    return { answer: result.answer, used_pdf: false, pages: [], label: "Picture", mode: "auto" as const };
  },
  createQuiz: (lessonId: string, num_questions = 5) => post<PublicQuiz>(`lessons/${lessonId}/quiz`, { num_questions }),
  quizProgress: (id: string) => call<{ answered: number; total: number; status: string; next_index: number | null; answers: { index: number; choice: number; correct: boolean }[] }>(`quiz/${id}/progress`),
  answerQuiz: (id: string, index: number, choice: number, expected_answered: number) => call<{ feedback: CheckOut }>(`quiz/${id}/answers`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": `answer-${id}-${index}` }, body: JSON.stringify({ index, choice, expected_answered }) }),
  finishQuiz: (id: string, expected_answered: number) => post(`quiz/${id}/finish`, { expected_answered }),
  retryQuiz: (id: string, which: "all" | "missed", key: string) => call<PublicQuiz>(`quiz/${id}/retry`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ which }) }),
  getQuiz: (id: string) => call<PublicQuiz>(`quiz/${id}`),
  check: (quizId: string, index: number, choice: number) => post<CheckOut>(`quiz/${quizId}/check`, { index, choice }),
  followup: (quizId: string, num_questions?: number) =>
    post<PublicQuiz>(`quiz/${quizId}/followup`, num_questions ? { num_questions } : {}),
  mistakesDeck: (quizId: string, which: "missed" | "all" = "missed") => post<PublicDeck>(`quiz/${quizId}/flashcards`, { which }),

  createDeck: (lessonId: string, num_cards = 8) => post<PublicDeck>(`lessons/${lessonId}/flashcards`, { num_cards }),
  getDeck: (id: string) => call<PublicDeck>(`flashcards/${id}`),
  review: (deckId: string, card: number, result: "know" | "again", expected_reviews?: number) =>
    call<DeckState>(`flashcards/${deckId}/review`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": `review-${deckId}-${expected_reviews ?? 0}-${card}` }, body: JSON.stringify({ card, result, ...(expected_reviews !== undefined ? { expected_reviews } : {}) }) }),

  completeLesson: (id: string) => post<{ lesson_id: string; completed_at: string }>(`lessons/${id}/complete`, {}),
  async prepareTournament(lessonId: string, count: number) {
    const lesson = await learnApi.getLesson(lessonId);
    await learnApi.approveLesson(lessonId, lesson.revision ?? 1);
    const quiz = await learnApi.createTournament(lessonId, count);
    await post(`tournament/${quiz.id}/approve`, { expected_revision: 1, confirmed: true });
    return quiz;
  },
  submitDuel: (id: string, answers: [number[], number[]]) => post<{ players: [SubmitOut, SubmitOut]; reward_coins: number }>(`tournament/${id}/duel`, { answers }),
  restartDeck: (id: string, expected_reviews: number, key: string) => call<PublicDeck>(`flashcards/${id}/restart`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ expected_reviews }) }),
  createTournament: (lesson_id: string, num_questions = 5) => post<PublicQuiz>("tournament", { lesson_id, num_questions }),
  getTournament: (id: string) => call<PublicQuiz>(`tournament/${id}`),
  submitTournament: (id: string, answers: number[]) => post<SubmitOut>(`tournament/${id}/submit`, { answers }),
};
