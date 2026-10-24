"use client";

import { useState } from "react";
import { Check, Play, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerChip } from "@/components/splash/player-chip";
import { Card, Eyebrow, Screen } from "@/components/splash/screen";
import { MIN_PLAYERS } from "@/lib/game/mock-room";
import { getPack } from "@/lib/game/packs";
import { type PhaseProps, WaitingNote } from "../shared";

const MAX_PLAYERS = 8;

export function Lobby({ room, top }: PhaseProps) {
  const { state, isHost, host } = room;
  const { players, settings, code } = state;
  const pack = getPack(settings.packId);
  const needed = Math.max(0, MIN_PLAYERS - players.length);
  const [shared, setShared] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/splash/room/${code}`;
    try {
      if (navigator.share) await navigator.share({ title: "Join my Splash game!", text: `Room code: ${code}`, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <Screen
      top={top}
      className="gap-5"
      footer={
        isHost ? (
          <Button variant="sun" size="game" className="w-full" disabled={needed > 0} onClick={room.actions.start}>
            {needed > 0 ? (
              `Waiting for ${needed} more player${needed > 1 ? "s" : ""}`
            ) : (
              <>
                <Play /> Start game
              </>
            )}
          </Button>
        ) : (
          <WaitingNote>Waiting for {host.name} to start</WaitingNote>
        )
      }
    >
      <Card className="flex flex-col items-center gap-3 text-center animate-rise">
        <Eyebrow>Room code</Eyebrow>
        <div className="flex gap-2" aria-label={`Room code ${code.split("").join(" ")}`}>
          {code.split("").map((c, i) => (
            <span
              key={i}
              aria-hidden
              className="grid size-16 place-items-center rounded-2xl bg-sun font-heading text-4xl font-bold text-ink shadow-[0_4px_0_0_color-mix(in_oklch,var(--sun),black_40%)]"
              style={{ rotate: `${[-4, 3, -2, 4][i]}deg` }}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Everyone opens Splash on their phone and taps <strong className="text-foreground">Join</strong>.
        </p>
        <Button variant="glass" size="lg" className="h-10 rounded-full px-4" onClick={share}>
          {shared ? <Check /> : <Share2 />} {shared ? "Link copied!" : "Share invite link"}
        </Button>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Players</h2>
          <span className="text-sm font-bold text-muted-foreground">
            {players.length}/{MAX_PLAYERS}
          </span>
        </div>
        <ul className="flex flex-col gap-2" aria-live="polite">
          {players.map((p) => (
            <li key={p.id} className="animate-pop">
              <PlayerChip player={p} isMe={p.id === state.meId} />
            </li>
          ))}
          {Array.from({ length: needed }, (_, i) => (
            <li
              key={`empty-${i}`}
              className="flex h-[66px] items-center justify-center rounded-2xl border-2 border-dashed border-white/10 text-sm font-bold text-muted-foreground"
            >
              Waiting for a player…
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
        <span className="rounded-full bg-white/6 px-3 py-1.5">
          {pack.emoji} {pack.name}
        </span>
        <span className="rounded-full bg-white/6 px-3 py-1.5">🔁 {settings.rounds} rounds</span>
        <span className="rounded-full bg-white/6 px-3 py-1.5">💬 {settings.discussSeconds}s chat</span>
      </div>
    </Screen>
  );
}
