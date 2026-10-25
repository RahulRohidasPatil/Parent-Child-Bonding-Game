"use client";

import { useState } from "react";
import { Check, EyeOff, SkipForward, Timer, X } from "lucide-react";
import { Card, Pill } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/games-api";

export type HeadsUpRoundProps = {
  turn: NonNullable<Match["view"]["turn"]>;
  remainingSeconds: number;
  busy: boolean;
  onAction: (action: "correct" | "skip" | "violation", cardIndex: number) => void;
};

/** The server owns the turn, card pointer, clock and score. This only controls the forehead reveal. */
export function HeadsUpRound({ turn, remainingSeconds, busy, onAction }: HeadsUpRoundProps) {
  const [readyTurn, setReadyTurn] = useState<number | null>(null);
  const seconds = Math.max(0, Math.ceil(remainingSeconds));
  const guesser = turn.you_are === "guesser";
  const explainer = turn.you_are === "explainer";
  const participating = guesser || explainer;
  const revealed = explainer || (guesser && readyTurn === turn.index);
  const card = participating ? turn.card : undefined;
  const canPlay = !!card && revealed && seconds > 0;

  return (
    <Card className="flex flex-col gap-5 p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] font-black tracking-[.04em] text-brand-ink uppercase">Heads-up · turn {turn.index + 1}</span>
          <span className="text-[16px] font-extrabold">{turn.guesser} guesses · {turn.explainer} explains</span>
        </span>
        <Pill className={seconds <= 10 ? "gap-1.5 bg-rose text-rose-ink" : "gap-1.5 bg-coin text-coin-ink"}>
          <Timer className="size-4" aria-hidden="true" /><span aria-label={`${seconds} seconds remaining`}>{seconds}s</span>
        </Pill>
      </div>

      {seconds === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl bg-muted p-6 text-center" role="status">
          <Timer className="size-9 text-brand-ink" aria-hidden="true" />
          <h2 className="text-[25px] font-black">Time’s up!</h2>
          <p className="text-[16px] font-bold text-muted-foreground">Wait for the next turn. You can lower the phone now.</p>
        </div>
      ) : !participating ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl bg-brand-soft p-6 text-center">
          <EyeOff className="size-9 text-brand-ink" aria-hidden="true" />
          <h2 className="text-[25px] font-black">Watch this pair</h2>
          <p className="max-w-md text-[16px] font-bold text-brand-ink">{turn.explainer} gives clues to {turn.guesser}. Keep the answer a secret—your turn is coming.</p>
        </div>
      ) : !card ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl bg-brand-soft p-6 text-center" role="status">
          <Check className="size-9 text-brand-ink" aria-hidden="true" />
          <h2 className="text-[25px] font-black">All cards played</h2>
          <p className="text-[16px] font-bold text-brand-ink">Great effort. Wait for the next turn or the results.</p>
        </div>
      ) : !revealed ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl bg-brand-soft p-6 text-center">
          <EyeOff className="size-9 text-brand-ink" aria-hidden="true" />
          <h2 className="text-[25px] font-black">Don’t look at the word</h2>
          <p className="max-w-lg text-[16px] font-bold text-brand-ink">Tap Ready, then hold your phone sideways against your forehead with the screen facing your partner. {turn.explainer} can read the word and give clues.</p>
          <Button variant="brand" size="cta" disabled={busy} onClick={() => setReadyTurn(turn.index)}>Ready — hold phone to forehead</Button>
        </div>
      ) : (
        <>
          <div className="flex min-h-60 flex-col items-center justify-center gap-5 rounded-2xl bg-brand-soft p-5 text-center md:min-h-72 md:p-8">
            <span className="text-[13px] font-black tracking-[.05em] text-brand-ink uppercase">{guesser ? "Keep the screen facing your partner" : "Explain this without saying it"}</span>
            <h2 className="max-w-full break-words text-[clamp(2.5rem,7vw,5.5rem)] leading-tight font-black text-brand-ink">{card.term}</h2>
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-black text-rose-ink">Don’t say these words</span>
              <ul className="flex flex-wrap justify-center gap-2" aria-label="Forbidden words">
                {card.forbidden.map((word, index) => <li key={`${index}-${word}`} className="rounded-xl bg-rose px-3 py-2 text-[16px] font-extrabold text-rose-ink md:text-[18px]">{word}</li>)}
              </ul>
            </div>
          </div>
          <p className="text-center text-sm font-bold text-muted-foreground">{guesser ? "Keep guessing. Your partner can mark answers on either phone." : `Give ${turn.guesser} clues. Mark each card when they answer, or skip it.`}</p>
        </>
      )}

      {canPlay && card && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Button variant="brand" size="cta" disabled={busy} onClick={() => onAction("correct", card.index)}><Check /> Got it</Button>
          <Button variant="soft" size="cta" disabled={busy} onClick={() => onAction("skip", card.index)}><SkipForward /> Skip</Button>
          <Button variant="soft" size="cta" className="col-span-2 text-rose-ink sm:col-span-1" disabled={busy} onClick={() => onAction("violation", card.index)}><X /> Forbidden word</Button>
        </div>
      )}
      {busy && <p className="text-center text-sm font-bold text-muted-foreground" role="status">Saving the card…</p>}
    </Card>
  );
}
