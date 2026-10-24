"use client";

import { useState } from "react";
import { BookMarked, SearchX, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askTutor, findSection, type LearningBlock, type TutorAnswer } from "@/lib/kay/content";
import { Blob } from "@/components/splash/blob";

type Turn = { q: string; a: TutorAnswer | null };

/**
 * "Ask Kay": answers only from this week's checked lesson content and cites
 * the section. When the content doesn't cover it, says so (plan §7).
 */
export function Tutor({ block }: { block: LearningBlock }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");

  const ask = (question: string) => {
    if (!question.trim()) return;
    setTurns((t) => [...t, { q: question.trim(), a: askTutor(block, question) }]);
    setQ("");
  };

  return (
    <section aria-labelledby="tutor-title" className="flex flex-col gap-3 rounded-3xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Blob color="grape" accessory="glasses" size={44} />
        <div>
          <h2 id="tutor-title" className="font-heading text-xl font-semibold">
            Ask Kay
          </h2>
          <p className="text-xs text-muted-foreground">Answers come only from this week&apos;s checked lessons.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {block.tutor.map((t) => (
          <button
            key={t.question}
            type="button"
            onClick={() => ask(t.question)}
            className="rounded-full border bg-background px-3 py-1.5 text-left text-sm font-semibold transition hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {t.question}
          </button>
        ))}
      </div>

      {turns.length > 0 && (
        <ol className="flex flex-col gap-3" aria-live="polite">
          {turns.map((turn, i) => {
            const src = turn.a ? findSection(turn.a.sourceId) : null;
            return (
              <li key={i} className="flex flex-col gap-2">
                <p className="self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
                  {turn.q}
                </p>
                {turn.a ? (
                  <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
                    <p className="flex gap-1.5">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-grape" aria-hidden />
                      {turn.a.answer}
                    </p>
                    {src && (
                      <p className="mt-2 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                        <BookMarked className="size-3.5" aria-hidden /> From the lesson: “{src.section.heading}”
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="self-start rounded-2xl rounded-bl-sm border border-dashed px-3 py-2 text-sm">
                    <p className="flex gap-1.5 font-semibold">
                      <SearchX className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                      I can&apos;t find that in this week&apos;s lessons, so I won&apos;t guess.
                    </p>
                    <p className="mt-1 text-muted-foreground">Try one of the questions above, or ask your teacher.</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question…"
          aria-label="Ask Kay a question about this lesson"
          className="h-12 flex-1 rounded-2xl bg-background px-4 text-base"
        />
        <Button type="submit" size="icon-lg" className="size-12 rounded-2xl" aria-label="Ask" disabled={!q.trim()}>
          <Send className="size-5" />
        </Button>
      </form>
    </section>
  );
}
