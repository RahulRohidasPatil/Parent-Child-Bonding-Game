"use client";

import { Check, X } from "lucide-react";
import { Face } from "@/components/qn/sprite";
import { Card, ProgressBar } from "@/components/qn/ui";
import { VisualFrame } from "@/components/qn/visual-frame";
import type { PublicQuestion } from "@/lib/learn-api";
import { AVATARS, type AvatarId } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

const KEYS = "ABCDEFGH";
type Result = { correct: boolean; choice: number | null; answer_index: number; explanation: string }; // null: ran out of time

export const tintOf = (id: AvatarId) => AVATARS.find((a) => a.id === id)?.tint;

/** One duel question: tapping an option commits it straight away. */
export function DuelQuestion({
  player,
  q,
  n,
  total,
  onAnswer,
}: {
  player: { name: string; avatar: AvatarId };
  q: PublicQuestion;
  n: number;
  total: number;
  onAnswer: (choice: number) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Face id={player.avatar} size={44} tint={tintOf(player.avatar)} />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-black">
            {player.name}’s turn · {n + 1} of {total}
          </span>
          <ProgressBar value={(n / total) * 100} className="h-2.5" />
        </span>
      </div>
      <Card className="flex flex-col gap-2 p-4 md:p-6">
        <span className="text-xs font-black tracking-[.06em] text-brand-ink uppercase">{q.type === "true_false" ? "True or false" : "Question"}</span>
        <h1 className="text-[20px] leading-snug font-black md:text-[24px]">{q.question}</h1>
        {q.visual_html && <VisualFrame html={q.visual_html} title="Lesson diagram" />}
      </Card>
      <div className={cn("grid gap-2.5", q.options.length === 2 ? "grid-cols-2" : "md:grid-cols-2")}>
        {q.options.map((o, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAnswer(i)}
            className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left text-[16px] font-extrabold shadow-[0_3px_0_#dde5ea] hover:bg-muted"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2f4] text-sm font-black">{KEYS[i]}</span>
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

/** Every question with the right answer and what each player picked. */
export function DuelReview({ questions, names, sheets }: { questions: PublicQuestion[]; names: string[]; sheets: Result[][] }) {
  return (
    <ol className="flex flex-col gap-3">
      {questions.map((q, i) => {
        const first = sheets[0][i];
        return (
          <li key={q.index}>
            <Card className="flex flex-col gap-2.5 p-4">
              <span className="text-[16px] font-black">
                {i + 1}. {q.question}
              </span>
              <span className="text-sm font-extrabold text-brand-dark">Answer: {q.options[first.answer_index]}</span>
              <div className={cn("grid grid-cols-1 gap-2", sheets.length > 1 && "sm:grid-cols-2")}>
                {sheets.map((sheet, p) => {
                  const r = sheet[i];
                  return (
                    <span key={p} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold", r.correct ? "bg-brand-soft" : "bg-[#fdecec]")}>
                      {r.correct ? <Check className="size-4 text-brand" strokeWidth={3} /> : <X className="size-4 text-[#d24d4d]" strokeWidth={3} />}
                      {names[p]}: {r.choice === null ? "no answer" : q.options[r.choice]}
                    </span>
                  );
                })}
              </div>
              <span className="text-sm leading-relaxed font-bold text-muted-foreground">{first.explanation}</span>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
