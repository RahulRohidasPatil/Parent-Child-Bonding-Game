"use client";

import Link from "next/link";
import { Crown, RotateCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Blob } from "@/components/splash/blob";
import { Confetti } from "@/components/splash/confetti";
import { PlayerChip } from "@/components/splash/player-chip";
import { Card, Screen } from "@/components/splash/screen";
import { cn } from "@/lib/utils";
import { PhaseHeading, type PhaseProps, WaitingNote } from "../shared";

const PODIUM = [
  { place: 2, height: "h-20", tint: "bg-sky/80" },
  { place: 1, height: "h-28", tint: "bg-sun" },
  { place: 3, height: "h-14", tint: "bg-coral/80" },
];

export function Scoreboard({ room, top }: PhaseProps) {
  const { state, isHost, host } = room;
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === topScore);
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  // Competition ranking: equal scores share a place.
  const rankOf = (score: number) => 1 + ranked.filter((p) => p.score > score).length;

  return (
    <Screen
      top={top}
      className="gap-6"
      footer={
        <>
          {isHost ? (
            <Button variant="sun" size="game" className="w-full" onClick={room.actions.playAgain}>
              <RotateCcw /> Play again
            </Button>
          ) : (
            <WaitingNote>Waiting for {host.name} to start a new game</WaitingNote>
          )}
          <Link href="/splash" className={cn(buttonVariants({ variant: "glass", size: "game" }), "w-full")}>
            Back to home
          </Link>
        </>
      }
    >
      <Confetti pieces={36} />
      <PhaseHeading
        eyebrow="Final scores"
        title={
          winners.length > 1
            ? "It's a tie at the top!"
            : `${winners[0].id === state.meId ? "You win" : `${winners[0].name} wins`}! 🏆`
        }
        sub="Great sleuthing, everyone."
      />

      <div className="grid grid-cols-3 items-end gap-2 pt-6" role="list" aria-label="Podium">
        {PODIUM.map(({ place, height, tint }) => {
          const p = podium[place - 1];
          if (!p) return <div key={place} />;
          return (
            <div key={p.id} role="listitem" className="flex flex-col items-center gap-1 animate-rise" style={{ animationDelay: `${(3 - place) * 150}ms` }}>
              {p.score === topScore && <Crown className="size-8 text-sun animate-float" aria-label="Winner" />}
              <Blob color={p.color} size={place === 1 ? 80 : 60} mood="happy" />
              <span className="max-w-full truncate font-heading text-lg font-semibold">
                {p.id === state.meId ? "You" : p.name}
              </span>
              <div
                className={cn(
                  "flex w-full flex-col items-center justify-start rounded-t-2xl pt-2 font-heading text-ink",
                  height,
                  tint,
                )}
              >
                <span className="text-2xl font-bold">{rankOf(p.score)}</span>
                <span className="text-xs font-bold">{p.score} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <ol className="flex flex-col gap-2">
          {rest.map((p) => (
            <li key={p.id}>
              <PlayerChip
                player={p}
                isMe={p.id === state.meId}
                trailing={
                  <span className="font-heading text-lg font-semibold tabular-nums">
                    #{rankOf(p.score)} · {p.score}
                  </span>
                }
              />
            </li>
          ))}
        </ol>
      )}

      <Card className="border-grape/40 bg-grape/15 text-center">
        <p className="font-heading text-xl font-semibold">📸 Family photo time!</p>
        <p className="text-sm text-muted-foreground">Who was the sneakiest imposter tonight? Crown them for real.</p>
      </Card>
    </Screen>
  );
}
