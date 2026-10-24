"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, RotateCcw, Shuffle, Undo2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Confetti } from "@/components/splash/confetti";
import type { LearningBlock } from "@/lib/kay/content";
import { cn } from "@/lib/utils";
import { Eyebrow, Page, ProgressBar } from "./ui";

export function FlashcardDeck({ block }: { block: LearningBlock }) {
  const [order, setOrder] = useState(() => block.flashcards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<string[]>([]);
  const [again, setAgain] = useState<string[]>([]);

  const done = pos >= order.length;
  const card = done ? null : block.flashcards[order[pos]];

  const grade = (gotIt: boolean) => {
    if (!card) return;
    (gotIt ? setKnown : setAgain)((xs) => [...xs, card.id]);
    setFlipped(false);
    setPos((p) => p + 1);
  };

  const restart = (onlyMissed: boolean) => {
    const ids = onlyMissed ? again : block.flashcards.map((c) => c.id);
    setOrder(block.flashcards.flatMap((c, i) => (ids.includes(c.id) ? [i] : [])));
    setPos(0);
    setKnown([]);
    setAgain([]);
    setFlipped(false);
  };

  // Keyboard: Space/Enter flips, ← still learning, → got it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement).closest("button, a, input")) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && e.key === "ArrowRight") grade(true);
      else if (flipped && e.key === "ArrowLeft") grade(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Page
      nav={false}
      back={`/learn/${block.id}`}
      title="Flashcards"
      actions={
        !done && (
          <Button
            variant="glass"
            size="icon-lg"
            className="size-11 rounded-full"
            aria-label="Shuffle"
            onClick={() => {
              setOrder((o) => [...o].sort(() => Math.random() - 0.5));
              setPos(0);
              setFlipped(false);
            }}
          >
            <Shuffle className="size-5" />
          </Button>
        )
      }
      footer={
        !done &&
        (flipped ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="glass" size="game" onClick={() => grade(false)}>
              <Undo2 /> Still learning
            </Button>
            <Button variant="mint" size="game" onClick={() => grade(true)}>
              <Check /> Got it
            </Button>
          </div>
        ) : (
          <Button size="game" className="w-full" onClick={() => setFlipped(true)}>
            Show answer
          </Button>
        ))
      }
    >
      <div className="flex items-center gap-3">
        <Eyebrow className="shrink-0">
          {block.emoji} {block.title}
        </Eyebrow>
        <ProgressBar value={Math.min(pos, order.length)} max={order.length} label="Cards done" tone="sun" />
        <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
          {Math.min(pos + 1, order.length)}/{order.length}
        </span>
      </div>

      {card && (
        <button
          key={`${card.id}-${flipped}`}
          type="button"
          onClick={() => setFlipped(!flipped)}
          aria-label={flipped ? "Showing answer. Tap to see the question" : "Showing question. Tap to see the answer"}
          className={cn(
            "flex min-h-80 flex-col items-center justify-center gap-4 rounded-[2rem] border-2 p-8 text-center shadow-lg [animation:kay-flip-in_260ms_ease-out] [perspective:800px]",
            "focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none",
            flipped ? "border-grape/40 bg-grape/12" : "bg-card",
          )}
        >
          <span className="text-6xl" aria-hidden>
            {card.emoji}
          </span>
          <Eyebrow>{flipped ? "Answer" : "Question"}</Eyebrow>
          <p aria-live="polite" className={cn("text-balance font-heading font-semibold", flipped ? "text-3xl" : "text-2xl")}>
            {flipped ? card.back : card.front}
          </p>
          {!flipped && <p className="text-sm text-muted-foreground">Say your answer out loud, then flip!</p>}
        </button>
      )}

      {!done && (
        <p className="hidden text-center text-xs text-muted-foreground sm:block">
          Keyboard: Space to flip · ← still learning · → got it
        </p>
      )}

      {done && (
        <div className="flex flex-col items-center gap-4 py-6 text-center animate-rise">
          {again.length === 0 && <Confetti />}
          <span className="text-7xl" aria-hidden>
            {again.length === 0 ? "🌟" : "💪"}
          </span>
          <h2 className="font-heading text-3xl font-semibold">
            {again.length === 0 ? "You know them all!" : "Deck done!"}
          </h2>
          <p className="text-lg text-muted-foreground">
            <strong className="text-foreground">{known.length}</strong> got it ·{" "}
            <strong className="text-foreground">{again.length}</strong> still learning
          </p>
          <div className="flex w-full flex-col gap-2">
            {again.length > 0 && (
              <Button size="game" onClick={() => restart(true)}>
                <RotateCcw /> Practise the {again.length} tricky {again.length === 1 ? "card" : "cards"}
              </Button>
            )}
            <Link href={`/learn/${block.id}/quiz`} className={cn(buttonVariants({ variant: again.length ? "glass" : "default", size: "game" }))}>
              Try the quiz
            </Link>
            <Link href="/learn" className={cn(buttonVariants({ variant: "ghost" }), "h-11")}>
              Back to blocks
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
