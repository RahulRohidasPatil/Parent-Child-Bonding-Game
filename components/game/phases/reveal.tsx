"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/splash/screen";
import { PeekCard, PhaseHeading, type PhaseProps, PlayerDots, WaitingNote } from "../shared";

export function Reveal({ room, top }: PhaseProps) {
  const { state, myCard } = room;
  const [peeked, setPeeked] = useState(false);
  const amReady = state.ready.includes(state.meId);
  if (!myCard) return null;

  return (
    <Screen
      top={top}
      className="gap-6"
      footer={
        amReady ? (
          <WaitingNote>Waiting for everyone to peek</WaitingNote>
        ) : (
          <Button variant="sun" size="game" className="w-full" disabled={!peeked} onClick={room.actions.ready}>
            <ThumbsUp /> {peeked ? "Got it!" : "Peek first"}
          </Button>
        )
      }
    >
      <PhaseHeading
        eyebrow="Secret time"
        title="What's your word?"
        sub="Only you can see this. Remember it, but keep a poker face!"
      />
      <PeekCard card={myCard} onPeek={() => setPeeked(true)} />
      <PlayerDots players={state.players} done={state.ready} />
    </Screen>
  );
}
