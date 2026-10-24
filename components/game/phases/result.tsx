"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Blob } from "@/components/splash/blob";
import { Confetti } from "@/components/splash/confetti";
import { Card, Eyebrow, Screen } from "@/components/splash/screen";
import { bondingPrompt } from "@/lib/game/packs";
import { roundPoints } from "@/lib/game/rules";
import { cn } from "@/lib/utils";
import { buzz, type PhaseProps, WaitingNote } from "../shared";

/** 0 = drumroll, 1 = who got the votes, 2 = verdict + details */
type Stage = 0 | 1 | 2;

export function RoundResult({ room, top }: PhaseProps) {
  const { state, isHost, host, isLastRound } = room;
  const outcome = state.outcome!;
  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    const a = setTimeout(() => setStage(1), 1800);
    const b = setTimeout(() => {
      setStage(2);
      buzz(60);
    }, 3600);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const byId = new Map(state.players.map((p) => [p.id, p]));
  const accused = outcome.accusedId ? byId.get(outcome.accusedId) : null;
  const imposter = byId.get(outcome.imposterId)!;
  const iAmImposter = outcome.imposterId === state.meId;
  const iWon = iAmImposter ? !outcome.caught : outcome.caught;
  const maxVotes = Math.max(1, ...Object.values(outcome.tally));

  return (
    <Screen
      top={top}
      className="items-center gap-5"
      footer={
        stage < 2 ? null : isHost ? (
          <Button
            variant="sun"
            size="game"
            className="w-full"
            onClick={isLastRound ? room.actions.showScores : room.actions.nextRound}
          >
            {isLastRound ? (
              <>
                <Trophy /> See final scores
              </>
            ) : (
              <>
                Next round <ArrowRight />
              </>
            )}
          </Button>
        ) : (
          <WaitingNote>Waiting for {host.name}</WaitingNote>
        )
      }
    >
      {stage === 2 && iWon && <Confetti />}

      {/* Stage 0: drumroll */}
      {stage === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center" aria-live="polite">
          <div className="flex -space-x-3">
            {state.players.map((p, i) => (
              <Blob
                key={p.id}
                color={p.color}
                mood="shock"
                size={60}
                className="animate-drumroll"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <h1 className="text-4xl font-semibold">The votes are in…</h1>
        </div>
      )}

      {/* Stage 1+: accused */}
      {stage >= 1 && (
        <div className="flex flex-col items-center gap-2 text-center animate-rise" aria-live="polite">
          <Eyebrow>{accused ? "Most votes" : "It's a tie!"}</Eyebrow>
          {accused ? (
            <>
              <Blob color={accused.color} mood={stage === 2 && outcome.caught ? "sus" : "shock"} size={120} className="animate-pop" />
              <h1 className="text-4xl font-semibold">
                {accused.id === state.meId ? "You" : accused.name}
              </h1>
            </>
          ) : (
            <h1 className="text-balance text-3xl font-semibold">Nobody got voted out!</h1>
          )}
        </div>
      )}

      {/* Stage 2: verdict */}
      {stage === 2 && (
        <>
          <div
            className={cn(
              "w-full rounded-3xl p-5 text-center animate-pop",
              outcome.caught ? "bg-mint text-ink" : "bg-imposter text-white",
            )}
          >
            <p className="font-heading text-3xl font-bold leading-tight">
              {outcome.caught
                ? "Caught! That's the imposter! 🎉"
                : accused
                  ? "Wrong Splashie! 😱"
                  : "The imposter slipped away! 😈"}
            </p>
            {!outcome.caught && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <Blob color={imposter.color} mood="sus" size={48} />
                <p className="text-left font-semibold">
                  The imposter was
                  <br />
                  <span className="font-heading text-2xl">{imposter.id === state.meId ? "you!" : imposter.name}</span>
                </p>
              </div>
            )}
          </div>

          <p className="font-heading text-2xl font-semibold">
            {iAmImposter
              ? outcome.caught
                ? "They got you! 🙈"
                : "You fooled everyone! 😈"
              : outcome.caught
                ? "You win this round! ✨"
                : "The imposter got away this time 💪"}
          </p>

          <Card className="flex w-full items-center gap-4 animate-rise">
            <span className="text-6xl" aria-hidden>
              {outcome.emoji}
            </span>
            <div>
              <Eyebrow>The secret word was</Eyebrow>
              <p className="font-heading text-3xl font-bold">{outcome.word}</p>
            </div>
          </Card>

          <Card className="w-full animate-rise [animation-delay:100ms]">
            <h2 className="mb-3 text-lg font-semibold">Votes &amp; points</h2>
            <ul className="flex flex-col gap-2.5">
              {state.players.map((p) => {
                const votes = outcome.tally[p.id] ?? 0;
                const gain = roundPoints(outcome.caught, p.id === outcome.imposterId);
                return (
                  <li key={p.id} className="flex items-center gap-3">
                    <Blob color={p.color} size={32} mood={p.id === outcome.imposterId ? "sus" : "happy"} />
                    <span className="w-20 truncate font-bold">{p.id === state.meId ? "You" : p.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn("h-full rounded-full", p.id === outcome.imposterId ? "bg-imposter" : "bg-sky")}
                        style={{ width: `${(votes / maxVotes) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-bold tabular-nums text-muted-foreground">{votes}</span>
                    <span
                      className={cn(
                        "w-10 rounded-full py-0.5 text-center text-xs font-extrabold",
                        gain ? "bg-sun text-ink" : "bg-white/8 text-muted-foreground",
                      )}
                    >
                      +{gain}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="w-full border-grape/40 bg-grape/15 animate-rise [animation-delay:200ms]">
            <Eyebrow className="text-grape">💬 Talk about it</Eyebrow>
            <p className="mt-1 text-balance font-heading text-xl font-semibold leading-snug">
              {bondingPrompt(state.round, outcome.word)}
            </p>
          </Card>
        </>
      )}
    </Screen>
  );
}
