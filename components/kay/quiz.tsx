"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, CheckCircle2, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Confetti } from "@/components/splash/confetti";
import { findSection, type LearningBlock } from "@/lib/kay/content";
import { cn } from "@/lib/utils";
import { Eyebrow, Page, Pill, ProgressBar, Ring } from "./ui";

const POINTS_PER_CORRECT = 10;

export function Quiz({ block }: { block: LearningBlock }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const total = block.quiz.length;
  const done = i >= total;
  const q = done ? null : block.quiz[i];
  const isRight = q !== null && picked === q.answer;

  const check = () => {
    if (picked === null || !q) return;
    setChecked(true);
    if (picked === q.answer) setCorrect((c) => c + 1);
  };
  const next = () => {
    setI(i + 1);
    setPicked(null);
    setChecked(false);
  };

  const source = q ? findSection(q.sourceId) : null;
  const pct = Math.round((correct / total) * 100);

  return (
    <Page
      nav={false}
      back={`/learn/${block.id}`}
      title="Quiz"
      actions={<Pill tone="sun">⚡ 1 activity</Pill>}
      footer={
        !done && (
          <Button size="game" className="w-full" disabled={picked === null} onClick={checked ? next : check}>
            {checked ? (
              <>
                {i + 1 === total ? "See results" : "Next question"} <ArrowRight />
              </>
            ) : (
              "Check answer"
            )}
          </Button>
        )
      }
    >
      {q && (
        <>
          <div className="flex items-center gap-3">
            <Eyebrow className="shrink-0">
              Question {i + 1} of {total}
            </Eyebrow>
            <ProgressBar value={i} max={total} label="Quiz progress" />
          </div>

          <fieldset key={q.id} className="flex flex-col gap-3 animate-rise">
            <legend className="mb-4 text-balance font-heading text-3xl font-semibold leading-tight">{q.prompt}</legend>
            {q.options.map((opt, oi) => {
              const isAnswer = oi === q.answer;
              const isPicked = oi === picked;
              return (
                <label
                  key={opt}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-lg font-semibold transition",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    !checked && isPicked && "border-primary bg-primary/8",
                    checked && isAnswer && "border-success bg-mint/20",
                    checked && isPicked && !isAnswer && "border-destructive bg-destructive/8",
                    checked && !isAnswer && !isPicked && "opacity-55",
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="sr-only"
                    checked={isPicked}
                    disabled={checked}
                    onChange={() => setPicked(oi)}
                  />
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border-2 font-heading text-sm",
                      !checked && isPicked && "border-primary bg-primary text-primary-foreground",
                    )}
                    aria-hidden
                  >
                    {checked && isAnswer ? (
                      <CheckCircle2 className="size-7 text-success" />
                    ) : checked && isPicked ? (
                      <XCircle className="size-7 text-destructive" />
                    ) : (
                      String.fromCharCode(65 + oi)
                    )}
                  </span>
                  {opt}
                </label>
              );
            })}
          </fieldset>

          {checked && (
            <div
              role="status"
              className={cn(
                "rounded-2xl p-4 animate-pop",
                isRight ? "bg-mint/25" : "bg-coral/20",
              )}
            >
              <p className="font-heading text-xl font-semibold">
                {isRight ? `Correct! +${POINTS_PER_CORRECT} pts 🎉` : "Not quite!"}
              </p>
              <p className="mt-1">{q.explanation}</p>
              {source && (
                <Link
                  href={`/learn/${source.block.id}#${source.section.id}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary underline-offset-4 hover:underline"
                >
                  <BookMarked className="size-4" aria-hidden /> Read: “{source.section.heading}”
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {done && (
        <div className="flex flex-col items-center gap-4 py-4 text-center animate-rise">
          {pct === 100 && <Confetti />}
          <Ring value={correct} max={total} size={140} label={`${correct} of ${total} correct`}>
            <span className="block font-heading text-4xl font-bold">
              {correct}/{total}
            </span>
          </Ring>
          <h2 className="font-heading text-3xl font-semibold">
            {pct === 100 ? "Perfect score!" : pct >= 50 ? "Nice work!" : "Good try!"}
          </h2>
          <p className="text-lg text-muted-foreground">
            You earned <strong className="text-foreground">{correct * POINTS_PER_CORRECT} points</strong>
            {pct === 100 && " and 1 step towards the Quiz Whiz badge"}.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href="/me/progress" className={cn(buttonVariants({ size: "game" }))}>
              See what to practise
            </Link>
            {pct < 100 && (
              <Link href={`/learn/${block.id}/flashcards`} className={cn(buttonVariants({ variant: "glass", size: "game" }))}>
                Review with flashcards
              </Link>
            )}
            <Link href="/learn" className={cn(buttonVariants({ variant: "ghost" }), "h-11")}>
              Back to blocks
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
