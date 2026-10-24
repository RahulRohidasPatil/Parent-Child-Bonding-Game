"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Blob } from "@/components/splash/blob";
import { Screen } from "@/components/splash/screen";
import { cn } from "@/lib/utils";
import { PeekPill, type PhaseProps, PhaseHeading, WaitingNote } from "../shared";

function validateClue(text: string, secretWord: string | null) {
  const t = text.trim();
  if (!t) return null;
  if (/\s/.test(t)) return "Just one word!";
  if (secretWord && t.toLowerCase() === secretWord.toLowerCase()) return "That's the secret word, silly! 🙈";
  return null;
}

export function ClueRound({ room, top }: PhaseProps) {
  const { state, myCard, currentTurnId } = room;
  const turnPlayer = state.players.find((p) => p.id === currentTurnId);
  const myTurn = currentTurnId === state.meId;
  const [clue, setClue] = useState("");
  const secretWord = myCard?.kind === "crew" ? myCard.word : null;
  const error = validateClue(clue, secretWord);
  const canSend = clue.trim().length > 0 && !error;

  const byId = new Map(state.players.map((p) => [p.id, p]));
  const given = new Map(state.clues.map((c) => [c.playerId, c.text]));

  const submit = () => {
    if (canSend) room.actions.clue(clue);
  };

  return (
    <Screen
      top={top}
      className="gap-5"
      footer={
        myTurn ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex gap-2">
              <Input
                autoFocus
                value={clue}
                maxLength={20}
                onChange={(e) => setClue(e.target.value)}
                placeholder="Your one-word clue"
                aria-label="Your one-word clue"
                aria-invalid={!!error || undefined}
                className="h-14 flex-1 rounded-2xl bg-white/8 px-4 font-heading text-xl md:text-xl"
              />
              <Button type="submit" variant="sun" size="game" className="px-5" disabled={!canSend} aria-label="Give clue">
                <Send />
              </Button>
            </div>
            <p className={cn("text-center text-sm", error ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
              {error ?? "Not too obvious, or the imposter will figure it out!"}
            </p>
          </form>
        ) : (
          <WaitingNote>{turnPlayer?.name} is thinking</WaitingNote>
        )
      }
    >
      <PhaseHeading
        eyebrow={`Clue ${state.clues.length + 1} of ${state.turnOrder.length}`}
        title={myTurn ? "Your turn!" : `${turnPlayer?.name}'s turn`}
        sub={myTurn ? "Say one word that hints at the secret." : "Listen closely… 👂"}
      />

      {myCard && <PeekPill card={myCard} />}

      <ol className="flex flex-col gap-2.5">
        {state.turnOrder.map((id) => {
          const p = byId.get(id)!;
          const text = given.get(id);
          const isTurn = id === currentTurnId;
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-2 transition",
                isTurn && "bg-sun/10 ring-2 ring-sun/60",
                !text && !isTurn && "opacity-45",
              )}
            >
              <Blob color={p.color} size={44} mood={isTurn ? "shock" : text ? "happy" : "sleepy"} className={cn(isTurn && "animate-float")} />
              <span className="w-28 shrink-0 truncate font-heading text-base font-semibold">
                {id === state.meId ? "You" : p.name}
              </span>
              {text ? (
                <span className="relative rounded-2xl rounded-tl-sm bg-foreground px-4 py-2 font-heading text-lg font-semibold text-ink animate-pop">
                  “{text}”
                </span>
              ) : isTurn ? (
                <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="size-2 animate-bounce rounded-full bg-foreground/60" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">up next</span>
              )}
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}
