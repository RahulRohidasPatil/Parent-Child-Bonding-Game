"use client";

import { useState } from "react";
import { Check, Hand, Timer, X } from "lucide-react";
import { Card, Pill, Spinner } from "@/components/qn/ui";
import { VisualFrame } from "@/components/qn/visual-frame";
import { Button } from "@/components/ui/button";
import type { Match } from "@/lib/games-api";

export type DiagramMatchBoardProps = {
  board: NonNullable<Match["view"]["board"]>;
  placements: Record<string, number>;
  html: string | null;
  busy: boolean;
  finished: boolean;
  remainingSeconds: number;
  wrongFinishes: number;
  feedback: string | null;
  onPlace: (placements: Record<string, number>) => void;
  onFinish: () => void;
};

/** Tap a word, then a labelled blank. Only server-returned placements are displayed as saved. */
export function DiagramMatchBoard({
  board, placements, html, busy, finished, remainingSeconds, wrongFinishes, feedback, onPlace, onFinish,
}: DiagramMatchBoardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const expired = remainingSeconds <= 0;
  const locked = busy || finished || expired;
  const valid = (value: number | undefined): value is number => Number.isInteger(value) && value !== undefined && value >= 0 && value < board.options.length;
  const selectedWord = selected !== null && valid(selected) ? selected : null;
  const filled = board.slots.filter((slot) => valid(placements[slot]));
  const complete = board.slots.length > 0 && filled.length === board.slots.length && new Set(filled.map((slot) => placements[slot])).size === board.slots.length;

  function place(slot: string) {
    if (locked) return;
    if (selectedWord === null) {
      if (valid(placements[slot])) setSelected(placements[slot]);
      return;
    }
    if (placements[slot] !== selectedWord) {
      // Moving a word removes its old position before saving the full mapping.
      const next = Object.fromEntries(Object.entries(placements).filter(([oldSlot, word]) => board.slots.includes(oldSlot) && word !== selectedWord));
      next[slot] = selectedWord;
      onPlace(next);
    }
    setSelected(null);
  }

  function clear(slot: string) {
    if (locked) return;
    const next = { ...placements };
    delete next[slot];
    onPlace(next);
  }

  return (
    <Card className="flex flex-col gap-5 p-4 md:p-5" aria-busy={busy}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[19px] font-black">{board.title}</h2>
        <Pill className={expired ? "bg-rose text-rose-ink" : "bg-coin text-coin-ink"}>
          <Timer className="mr-1.5 size-4" /> {Math.max(0, Math.ceil(remainingSeconds))}s
        </Pill>
      </div>
      {html ? <VisualFrame html={html} title={board.title} /> : <div className="flex items-center gap-2 py-8 font-bold" role="status"><Spinner /> Loading the diagram…</div>}

      {finished ? (
        <p className="flex items-center gap-2 rounded-2xl bg-brand-soft p-4 font-extrabold text-brand-ink" role="status"><Check /> Your diagram is complete. Waiting for the other players.</p>
      ) : expired ? (
        <p className="rounded-2xl bg-warn p-4 font-extrabold text-warn-ink" role="status">Time is up. Waiting for the results.</p>
      ) : (
        <p className="flex items-center gap-2 text-[15px] font-bold text-muted-foreground"><Hand className="size-5 shrink-0" /> Tap a word, then tap its blank below. Match the blank’s ID to the diagram.</p>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-[15px] font-black">Word bank</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Word bank">
          {board.options.map((word, index) => {
            const placedAt = board.slots.find((slot) => placements[slot] === index);
            return (
              <Button key={index} variant={selectedWord === index ? "brand" : "soft"} size="pill" className="h-auto min-h-11 whitespace-normal py-2 text-left" disabled={locked}
                aria-label={`Select label ${index + 1}: ${word}${placedAt ? `, placed in ${placedAt}` : ""}`} aria-pressed={selectedWord === index}
                onClick={() => setSelected(selectedWord === index ? null : index)}>
                {word}{placedAt && <span className="ml-1 text-xs opacity-75">· {placedAt}</span>}
              </Button>
            );
          })}
        </div>
        <p className="min-h-5 text-sm font-bold text-brand-ink" aria-live="polite">
          {!locked && selectedWord !== null ? `Selected: ${board.options[selectedWord]}. Choose a blank.` : !locked ? "Placed words can be selected again to move them." : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Diagram blanks">
        {board.slots.map((slot) => {
          const word = valid(placements[slot]) ? board.options[placements[slot]] : null;
          return (
            <div key={slot} className="flex items-center gap-2 rounded-2xl border border-line bg-background p-2">
              <Button variant={word ? "brandSoft" : "soft"} size="pill" className="h-auto min-h-14 flex-1 justify-start whitespace-normal py-2 text-left" disabled={locked || (selectedWord === null && word === null)}
                aria-label={`Slot ${slot}: ${word ?? "empty"}`} onClick={() => place(slot)}>
                <span className="mr-2 shrink-0 rounded-lg bg-card px-2 py-1 text-xs font-black">{slot}</span>
                <span>{word ?? "Place selected word"}</span>
              </Button>
              {word !== null && <Button variant="ghost" size="round" aria-label={`Clear slot ${slot}`} disabled={locked} onClick={() => clear(slot)}><X /></Button>}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold text-muted-foreground">{filled.length}/{board.slots.length} labels placed · {wrongFinishes} incorrect {wrongFinishes === 1 ? "submission" : "submissions"}</span>
        <Button variant="brand" size="cta" disabled={locked || !complete} onClick={onFinish}>
          {finished ? "Diagram completed" : busy ? "Saving…" : expired ? "Time is up" : "Check my diagram"}
        </Button>
        {feedback && <p className="rounded-xl bg-muted p-3 font-bold" role="status">{feedback}</p>}
      </div>
    </Card>
  );
}
