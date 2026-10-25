/**
 * The "Ask anything" chat: messages, the file the conversation is about, and the helpers that turn a
 * chat answer into something the lesson, quiz and flashcard endpoints accept.
 */
import { ApiError, learnApi } from "./learn-api";
import { STUDY_PLAN_PROMPT, type StudyPlan } from "./study-plan";

export type ChatFile = { id: string; name: string; kind: "pdf" | "photos"; pages: number };
export type ChatModes = { pdfOnly: boolean; plan: boolean };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: number;
  // user
  file?: { name: string; kind: "pdf" | "photos" };
  modes?: ChatModes;
  sent?: string; // what was actually sent, when it differs from `text` (e.g. the file-only prompt)
  hidden?: boolean; // the text was written by the app, not the learner: show only the file
  // assistant
  ask?: string; // the question this answers
  material?: ChatFile | null; // the file that was attached when it was answered
  usedFile?: boolean;
  pages?: number[];
  label?: string | null;
  planId?: string;
  error?: boolean;
  lessonId?: string; // made on the first Flashcards/Quiz tap, shared by both
  quizId?: string;
  deckId?: string;
};

export type ChatState = { messages: ChatMessage[]; material: ChatFile | null };
export const EMPTY_CHAT: ChatState = { messages: [], material: null };
/** One saved conversation in the chat history. */
export type Conversation = ChatState & { id: string; title: string; updatedAt: number };

/** The history title: the first question, or the file's name when only a file was sent. */
export function titleOf(c: ChatState) {
  const first = c.messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const t = first.hidden ? (first.file?.name ?? "My notes") : first.text;
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

/** Sent when only a file is attached: asks for the ideas themselves, not a description of the file. */
export const TEACH_FILE_PROMPT =
  "Teach me what this document teaches. Go through each idea in it, in order, and explain it in simple words with an example, so I understand it without reading the document. Don't describe the document or say which page something is on; explain the ideas themselves.";
/** The study-plan version (shorter: the plan's layout instruction takes most of the 1000 characters). */
export const PLAN_FILE_PROMPT = "Cover everything this document teaches.";

/** "Explain", "explain this", "summarise my notes"...: a request for the whole file, not a question about it. */
const WHOLE_FILE =
  /^(?:please\s+)?(?:(?:explain|summari[sz]e|teach|cover|go\s+through|study|learn)\b\s*)?(?:me\s+)?(?:(?:from|about|on)\s+)?(?:(?:all|the|my|this|these|that|whole|entire|full|attached|uploaded)\s+)*(?:notes?|pdf|document|doc|file|book|upload|chapter|photo|picture|image|everything|it|all)?\s*(?:please)?[.!?]*$/i;
export const asksForWholeFile = (text: string) => WHOLE_FILE.test(text.trim());

export const MESSAGE_MAX = 1000; // the chat API's message limit
/** A study plan request carries the layout instruction, which leaves this much for the question. */
export const PLAN_QUESTION_MAX = MESSAGE_MAX - STUDY_PLAN_PROMPT.length;

const TURN_MAX = 3000; // the chat API's limit per history turn
const KEEP_TURNS = 8; // it reads the last 10

/** Recent turns for the stateless chat API, oldest first. */
export function historyFor(messages: ChatMessage[]) {
  return messages
    .filter((m) => !m.error)
    .slice(-KEEP_TURNS)
    .map((m) => ({ role: m.role, content: (m.sent ?? m.text).slice(0, TURN_MAX) }));
}

/** A topic the upload's pages contain, or the whole upload when they don't (the find check is free). */
async function inUpload(topic: string, file: { id: string; pages: number }) {
  try {
    await learnApi.findPages(file.id, topic);
    return topic;
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return `pages 1-${file.pages}`;
    throw e;
  }
}

/**
 * Quizzes and flashcards are built from a lesson, so a chat answer first becomes a lesson on the same
 * ground: the pages the answer used, the study plan's main topic, or the learner's question.
 */
export async function lessonTopicFor(msg: ChatMessage, plan?: StudyPlan): Promise<{ topic: string; materialId?: string }> {
  // A plan keeps its file only when the plan was made from it.
  const file = plan ? plan.material : msg.usedFile ? (msg.material ?? null) : null;
  if (file && !plan && msg.pages?.length) {
    const lo = Math.min(...msg.pages);
    const hi = Math.max(...msg.pages);
    return { topic: lo === hi ? `page ${lo}` : `pages ${lo}-${hi}`, materialId: file.id };
  }
  const topic = (plan?.title ?? msg.ask ?? msg.text).slice(0, 200);
  if (file) return { topic: await inUpload(topic, file), materialId: file.id };
  return { topic };
}
