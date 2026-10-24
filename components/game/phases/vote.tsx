"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Blob } from "@/components/splash/blob";
import { Screen } from "@/components/splash/screen";
import { cn } from "@/lib/utils";
import { buzz, PhaseHeading, type PhaseProps, PlayerDots, WaitingNote } from "../shared";

export function Vote({ room, top }: PhaseProps) {
  const { state } = room;
  const myVote = state.votes[state.meId];
  const [picked, setPicked] = useState<string | null>(null);
  const suspects = state.players.filter((p) => p.id !== state.meId);
  const clueOf = new Map(state.clues.map((c) => [c.playerId, c.text]));
  const pickedName = suspects.find((p) => p.id === picked)?.name;
  const locked = !!myVote;

  return (
    <Screen
      top={top}
      className="gap-5"
      footer={
        locked ? (
          <WaitingNote>Vote locked in. Waiting for the others</WaitingNote>
        ) : (
          <Button
            variant="coral"
            size="game"
            className="w-full"
            disabled={!picked}
            onClick={() => {
              if (!picked) return;
              buzz(30);
              room.actions.vote(picked);
            }}
          >
            <Lock /> {pickedName ? `Vote for ${pickedName}` : "Pick a suspect"}
          </Button>
        )
      }
    >
      <PhaseHeading eyebrow="Vote" title="Who's the imposter?" sub="Votes are secret until everyone's in." />

      <fieldset disabled={locked}>
        <legend className="sr-only">Choose who you think is the imposter</legend>
        <div className="grid grid-cols-2 gap-3">
          {suspects.map((p) => {
            const selected = (myVote ?? picked) === p.id;
            return (
              <label
                key={p.id}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-1.5 rounded-3xl border-2 border-white/10 bg-white/5 p-4 text-center transition",
                  "has-focus-visible:ring-4 has-focus-visible:ring-ring/50",
                  selected && "-rotate-1 scale-[1.03] border-coral bg-coral/15",
                  locked && !selected && "opacity-40",
                )}
              >
                <input
                  type="radio"
                  name="vote"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setPicked(p.id)}
                />
                <Blob color={p.color} size={72} mood={selected ? "shock" : "sus"} className={cn(selected && "animate-wiggle")} />
                <span className="font-heading text-xl font-semibold leading-tight">{p.name}</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold">“{clueOf.get(p.id)}”</span>
                {selected && (
                  <span className="absolute -top-2 -right-2 rotate-12 rounded-full bg-coral px-2 py-0.5 text-xs font-extrabold uppercase text-ink animate-pop">
                    Sus!
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <PlayerDots players={state.players} done={Object.keys(state.votes)} />
    </Screen>
  );
}
