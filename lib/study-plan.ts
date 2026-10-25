/**
 * Study plans: the learner's prompt plus a fixed layout instruction goes to POST /api/chat, and the
 * free-text answer is split into subtopics on the 9-dollar separator line.
 */

export type Subtopic = { title: string; body: string; diagram: string | null; lessonId?: string };
export type StudyPlan = {
  id: string;
  title: string;
  overview: string;
  subtopics: Subtopic[];
  prompt: string;
  source: string | null; // e.g. "Used the PDF for this answer (page 1)"
  material: { id: string; pages: number } | null; // the upload the plan was made from
  at: number;
};

export const SEPARATOR = "$$$$$$$$$";

/** Sent when a file is uploaded and the prompt box is left empty. */
export const DEFAULT_UPLOAD_PROMPT = "Explain the attached document";

/**
 * Appended to the learner's prompt. Labelled lines and a separator the model is told never to use
 * elsewhere keep the answer parseable; a separator after the last subtopic closes it cleanly.
 */
export const STUDY_PLAN_PROMPT = `

Turn this into a detailed study plan. Reply in exactly this layout and nothing else:
MAIN TOPIC: <short title>
OVERVIEW: <3-4 sentences on what the plan covers and why it matters>
${SEPARATOR}
SUBTOPIC: <short title, using the words the material uses>
<a highly detailed explanation in 3 to 5 paragraphs: what it is, how it works step by step, key terms and their meanings, a worked example, and a common mistake to avoid>
DIAGRAM:
<a simple text diagram using arrows (->) or a labelled list, or "none">
${SEPARATOR}
Repeat the SUBTOPIC block for each subtopic: 3 to 6, in the order to learn them.
Rules: a line of exactly 9 dollar signs goes before every SUBTOPIC and once after the last one. Never use the dollar sign anywhere else.`;

/**
 * The lesson topic for one subtopic. From an upload the topic must name something in the pages, so it
 * stays the subtopic's own title; otherwise it asks for depth (the lesson API allows 200 characters).
 */
export function subtopicTopic(plan: StudyPlan, sub: Subtopic) {
  if (plan.material) return sub.title.slice(0, 200);
  const full = `${sub.title} (part of ${plan.title}), explained in detail with examples`;
  return (full.length <= 200 ? full : `${sub.title}, explained in detail with examples`).slice(0, 200);
}

export const planMessage = (prompt: string) => (prompt.trim() || DEFAULT_UPLOAD_PROMPT) + STUDY_PLAN_PROMPT;

// Tolerant of a miscounted separator and of markdown the model may add around the labels ("**SUBTOPIC:**").
const SPLIT = /\${5,}/;
const label = (name: string) => new RegExp(`^[#*_\\s]*${name}[*_\\s]*:[*_\\s]*(.*)$`, "im");
const SUBTOPIC = label("SUBTOPIC");
const DIAGRAM = /^[#*_\s]*DIAGRAM[*_\s]*:[*_\s]*/im;

function subtopic(chunk: string, n: number): Subtopic {
  const head = chunk.match(SUBTOPIC);
  let title = head?.[1].trim();
  let rest = head ? chunk.replace(SUBTOPIC, "") : chunk;
  if (!title) {
    const [first, ...lines] = rest.trim().split("\n");
    title = first.trim() || `Part ${n}`;
    rest = lines.join("\n");
  }
  const d = rest.search(DIAGRAM);
  const body = (d < 0 ? rest : rest.slice(0, d)).trim();
  const diagram = d < 0 ? null : rest.slice(d).replace(DIAGRAM, "").trim();
  return { title, body, diagram: diagram && !/^none\.?$/i.test(diagram) ? diagram : null };
}

/** Split a study-plan answer into the main topic and its subtopics. */
export function parseStudyPlan(answer: string, fallbackTitle: string): Omit<StudyPlan, "id" | "prompt" | "source" | "material" | "at"> {
  let chunks = answer.split(SPLIT).map((c) => c.trim()).filter(Boolean);
  // No separators came back: fall back to the SUBTOPIC labels.
  if (chunks.length < 2) chunks = answer.split(/(?=^[#*_\s]*SUBTOPIC[*_\s]*:)/im).map((c) => c.trim()).filter(Boolean);

  const [first, ...others] = chunks;
  const headerHasSubtopic = SUBTOPIC.test(first ?? "");
  const header = headerHasSubtopic ? "" : (first ?? "");
  const parts = headerHasSubtopic ? chunks : others;

  const title = header.match(label("MAIN TOPIC"))?.[1].trim() || fallbackTitle;
  const overview =
    header.match(label("OVERVIEW"))?.[1].trim() ||
    header
      .replace(label("MAIN TOPIC"), "")
      .trim();
  const subtopics = parts.map(subtopic).filter((s) => s.body || s.diagram);
  // Nothing recognisable: keep the whole answer as one part rather than losing it.
  if (subtopics.length === 0) return { title, overview: "", subtopics: [{ title, body: answer.trim(), diagram: null }] };
  return { title, overview, subtopics };
}
