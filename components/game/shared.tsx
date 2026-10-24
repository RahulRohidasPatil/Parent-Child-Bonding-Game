"use client";

import { useState } from "react";
import { Check, Eye } from "lucide-react";
import { Blob } from "@/components/splash/blob";
import type { Room } from "@/lib/game/mock-room";
import type { Player, SecretCard } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type PhaseProps = { room: Room; top: React.ReactNode };

export const buzz = (ms = 15) => {
  try {
    navigator.vibrate?.(ms);
  } catch {}
};

export function PhaseHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center animate-rise">
      {eyebrow && (
        <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
      )}
      <h1 className="text-balance text-4xl font-semibold leading-tight">{title}</h1>
      {sub && <p className="max-w-xs text-balance text-muted-foreground">{sub}</p>}
    </div>
  );
}

/** Row of avatars that tick off as each player finishes a step. */
export function PlayerDots({ players, done }: { players: Player[]; done: string[] }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <ul className="flex flex-wrap justify-center gap-2">
        {players.map((p) => {
          const isDone = done.includes(p.id);
          return (
            <li key={p.id} className="relative" title={p.name}>
              <Blob
                color={p.color}
                size={40}
                mood={isDone ? "happy" : "sleepy"}
                className={cn("transition", !isDone && "opacity-45")}
              />
              {isDone && (
                <Check className="absolute -right-1 -bottom-1 size-5 rounded-full bg-mint p-0.5 text-ink animate-pop" />
              )}
              <span className="sr-only">
                {p.name} {isDone ? "is done" : "is still deciding"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-sm font-bold text-muted-foreground" aria-live="polite">
        {done.length}/{players.length} done
      </p>
    </div>
  );
}

export function WaitingNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 py-3 text-center font-heading text-lg text-muted-foreground" aria-live="polite">
      {children}
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-current"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </p>
  );
}

/** Press-and-hold handlers so the secret only shows while a finger (or key) is down. */
function useHold(onPeek?: () => void) {
  const [holding, setHolding] = useState(false);
  const start = () => {
    if (!holding) buzz();
    setHolding(true);
    onPeek?.();
  };
  const stop = () => setHolding(false);
  return {
    holding,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        start();
      },
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          start();
        }
      },
      onKeyUp: stop,
      onBlur: stop,
    },
  };
}

export function SecretFace({ card, compact }: { card: SecretCard; compact?: boolean }) {
  if (card.kind === "imposter") {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <Blob color="grape" mood="sus" size={compact ? 56 : 96} />
        <p className={cn("font-heading font-bold text-imposter", compact ? "text-2xl" : "text-4xl")}>
          You&apos;re the imposter!
        </p>
        <p className="text-balance text-sm text-foreground/80">
          The category is <strong>{card.category}</strong>. Listen to the clues and blend in. 🤫
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className={cn("leading-none", compact ? "text-6xl" : "text-8xl")} aria-hidden>
        {card.emoji}
      </span>
      <p className={cn("font-heading font-bold", compact ? "text-3xl" : "text-5xl")}>{card.word}</p>
      <p className="text-sm text-foreground/70">
        Category: <strong>{card.category}</strong>
      </p>
    </div>
  );
}

/** The big hold-to-peek card used on the reveal screen. */
export function PeekCard({ card, onPeek }: { card: SecretCard; onPeek?: () => void }) {
  const { holding, handlers } = useHold(onPeek);
  return (
    <button
      type="button"
      {...handlers}
      aria-label="Press and hold to see your secret"
      className={cn(
        "relative grid min-h-80 w-full touch-none select-none place-items-center overflow-hidden rounded-[2rem] border-2 p-6 transition-all duration-200 focus-visible:ring-4 focus-visible:ring-ring/50 focus-visible:outline-none",
        holding
          ? card.kind === "imposter"
            ? "scale-[0.98] border-imposter/70 bg-imposter/15"
            : "scale-[0.98] border-sun/70 bg-sun/12"
          : "border-dashed border-white/20 bg-white/5",
      )}
    >
      {holding ? (
        <div className="animate-pop" aria-live="assertive">
          <SecretFace card={card} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <Blob color="sun" mood="sleepy" size={88} className="animate-float" />
          <p className="font-heading text-2xl font-semibold">Press &amp; hold to peek</p>
          <p className="max-w-56 text-sm text-muted-foreground">Cover your screen. No peeking, siblings! 👀</p>
        </div>
      )}
    </button>
  );
}

/** Small hold-to-peek pill for later phases, in case someone forgets their word. */
export function PeekPill({ card }: { card: SecretCard }) {
  const { holding, handlers } = useHold();
  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        {...handlers}
        className="flex touch-none select-none items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-sm font-bold text-muted-foreground transition hover:bg-white/12 focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <Eye className="size-4" /> Hold to see my word
      </button>
      {holding && (
        <div className="absolute top-full z-30 mt-2 w-72 rounded-3xl border border-white/15 bg-popover p-5 shadow-2xl animate-pop">
          <SecretFace card={card} compact />
        </div>
      )}
    </div>
  );
}
