"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { Card, Spinner } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { ApiError, type PublicLesson, learnApi } from "@/lib/learn-api";
import { cn } from "@/lib/utils";

const MESSAGE_MAX = 1000; // the chat API's message limit
const TURN_MAX = 3000; // ...and its limit per history turn
const KEEP_TURNS = 8; // the API reads the last 10 turns; two of them are the lesson itself

type Turn = { role: "user" | "assistant"; content: string; label?: string | null; error?: boolean };

const SUGGESTIONS = ["Explain it more simply", "Give me another example", "Why does this matter?"];

function load(key: string): Turn[] {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "[]") as Turn[];
  } catch {
    return [];
  }
}
function save(key: string, turns: Turn[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify(turns.filter((t) => !t.error)));
  } catch {
    /* fine: only affects restoring after a reload */
  }
}

/** The chat API is stateless, so the lesson goes first in `history` to keep answers about it. */
function lessonTurns(l: PublicLesson) {
  const text = [l.summary, ...l.sections.map((s) => `${s.heading}\n${s.body}`), `Key points: ${l.key_points.join("; ")}`].join("\n\n");
  return [
    { role: "user" as const, content: `Teach me this lesson: ${l.title}` },
    { role: "assistant" as const, content: text.slice(0, TURN_MAX) },
  ];
}

// Models sometimes answer in markdown; show it as plain text.
const plain = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s+/gm, "");

/** Ask follow-up questions about a lesson in a chat (POST /api/chat). */
export function LessonChat({ lesson }: { lesson: PublicLesson }) {
  const id = useId();
  const key = `qn.chat.${lesson.id}`;
  const [turns, setTurns] = useState<Turn[]>(() => (typeof window === "undefined" ? [] : load(key)));
  const [ask, setAsk] = useState("");
  const [asking, setAsking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length) end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length, asking]);

  async function send(text = ask) {
    const message = text.trim().slice(0, MESSAGE_MAX);
    if (!message || asking) return;
    const before = turns.filter((t) => !t.error);
    const mine: Turn = { role: "user", content: message };
    setTurns([...before, mine]);
    setAsk("");
    setAsking(true);
    try {
      const out = await learnApi.chat({
        message,
        age: lesson.age,
        history: [...lessonTurns(lesson), ...before.slice(-KEEP_TURNS).map((t) => ({ role: t.role, content: t.content.slice(0, TURN_MAX) }))],
        // From an upload, answers use the learner's pages when they help.
        ...(lesson.source ? { material_id: lesson.source.material_id } : {}),
      });
      const next = [...before, mine, { role: "assistant" as const, content: out.answer, label: out.label }];
      setTurns(next);
      save(key, next);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Couldn’t answer that. Try again.";
      setTurns([...before, mine, { role: "assistant", content: msg, error: true }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3 p-4 md:p-5" aria-labelledby={`${id}-h`} role="region">
      <h2 id={`${id}-h`} className="flex items-center gap-2 text-[19px] font-black">
        <MessageCircleQuestion className="size-5 text-brand" /> Ask a follow-up question
      </h2>

      {turns.length > 0 && (
        <div className="flex max-h-[520px] flex-col gap-2.5 overflow-y-auto rounded-2xl bg-background p-3" aria-live="polite">
          {turns.map((t, i) =>
            t.role === "user" ? (
              <p key={i} className="max-w-[85%] self-end rounded-[18px_18px_4px_18px] bg-night px-3.5 py-2.5 text-[15px] leading-snug font-extrabold whitespace-pre-line text-white">
                {t.content}
              </p>
            ) : (
              <div key={i} className="flex max-w-[90%] flex-col gap-1 self-start">
                <p
                  className={cn(
                    "rounded-[18px_18px_18px_4px] px-3.5 py-2.5 text-[15px] leading-relaxed font-semibold whitespace-pre-line",
                    t.error ? "bg-destructive/10 text-destructive" : "bg-card text-[#2b3a47]",
                  )}
                >
                  {plain(t.content)}
                </p>
                {t.label && <span className="px-1 text-xs font-bold text-muted-foreground">{t.label}</span>}
              </div>
            ),
          )}
          {asking && (
            <span className="flex items-center gap-2 self-start rounded-[18px_18px_18px_4px] bg-card px-3.5 py-2.5 text-sm font-extrabold text-muted-foreground" role="status">
              <Spinner className="text-brand" /> Thinking…
            </span>
          )}
          <div ref={end} />
        </div>
      )}

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              disabled={asking}
              className="rounded-full border border-line bg-card px-3.5 py-2 text-sm font-extrabold hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor={id} className="sr-only">
          Your follow-up question
        </label>
        <input
          id={id}
          maxLength={MESSAGE_MAX}
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          placeholder="e.g. Why are leaves green?"
          className="h-[52px] w-full min-w-0 shrink-0 rounded-2xl border-[1.5px] border-input bg-field px-3.5 text-base font-bold text-foreground outline-none placeholder:font-semibold placeholder:text-[#7b8994] focus-visible:border-brand sm:flex-1 sm:shrink"
        />
        <Button type="submit" variant="brand" size="pill" className="h-[52px]" disabled={asking || !ask.trim()}>
          {asking ? <Spinner /> : <Send />} Ask
        </Button>
      </form>
      <span className="text-[13px] font-bold text-muted-foreground">
        {lesson.source ? "Answers use your notes where they can, written for your age." : `Answers are about this lesson, written for age ${lesson.age}.`}
      </span>
    </Card>
  );
}
