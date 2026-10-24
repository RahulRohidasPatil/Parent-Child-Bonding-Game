"use client";

import { Vote as VoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Blob } from "@/components/splash/blob";
import { Card, Screen } from "@/components/splash/screen";
import { TimerRing } from "@/components/splash/timer-ring";
import { PeekPill, PhaseHeading, type PhaseProps, PlayerDots } from "../shared";

const TALKING_POINTS = ["Why did you say that? 🤔", "Defend your clue!", "Who seemed unsure?"];

export function Discussion({ room, top }: PhaseProps) {
  const { state, myCard, isHost } = room;
  const amReady = state.ready.includes(state.meId);
  const byId = new Map(state.players.map((p) => [p.id, p]));

  return (
    <Screen
      top={top}
      className="items-center gap-5"
      footer={
        <>
          <Button
            variant={amReady ? "glass" : "coral"}
            size="game"
            className="w-full"
            disabled={amReady}
            onClick={room.actions.discussReady}
          >
            <VoteIcon /> {amReady ? "Ready! Waiting for others…" : "I'm ready to vote"}
          </Button>
          {isHost && (
            <Button variant="ghost" className="text-muted-foreground" onClick={room.actions.skipToVote}>
              Skip to voting now
            </Button>
          )}
        </>
      }
    >
      <PhaseHeading eyebrow="Talk it out" title="Who's acting sus?" />
      {state.discussEndsAt && (
        <TimerRing endsAt={state.discussEndsAt} totalSeconds={state.settings.discussSeconds} />
      )}

      <ul className="flex flex-wrap justify-center gap-2">
        {TALKING_POINTS.map((t) => (
          <li key={t} className="rounded-full bg-white/6 px-3 py-1.5 text-sm font-bold">
            {t}
          </li>
        ))}
      </ul>

      <Card className="w-full">
        <h2 className="mb-3 text-lg font-semibold">The clues</h2>
        <ul className="grid grid-cols-2 gap-2">
          {state.clues.map((c) => {
            const p = byId.get(c.playerId)!;
            return (
              <li key={c.playerId} className="flex items-center gap-2 rounded-2xl bg-white/5 p-2">
                <Blob color={p.color} size={32} mood="sus" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-muted-foreground">
                    {c.playerId === state.meId ? "You" : p.name}
                  </p>
                  <p className="truncate font-heading text-lg font-semibold leading-tight">“{c.text}”</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {myCard && <PeekPill card={myCard} />}
      <PlayerDots players={state.players} done={state.ready} />
    </Screen>
  );
}
