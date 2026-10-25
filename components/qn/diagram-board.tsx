"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { Board } from "@/lib/diagram-api";
import { parseViewBox } from "@/lib/diagram-placement";
import { cn } from "@/lib/utils";

/** SVGs stay in image context: no inline script, event handlers, or source HTML enters our DOM. */
export function FrozenDiagram({
  svg,
  viewBox,
  board,
  placements = {},
  selected,
  wrong = [],
  disabled = true,
  onPlace,
}: {
  svg: string;
  viewBox?: string;
  board?: Board;
  placements?: Record<string, string>;
  selected?: string | null;
  wrong?: string[];
  disabled?: boolean;
  onPlace?: (slotId: string, cardId: string | null) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const rawViewBox =
    viewBox ?? svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
  const box = parseViewBox(rawViewBox);
  const src = useMemo(
    () => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
    [svg],
  );
  if (!box)
    return (
      <p role="alert" className="p-5 text-sm font-bold text-destructive">
        This diagram has an invalid viewBox. Reload the round.
      </p>
    );
  const [x, y, width, height] = box;
  const cards = new Map(board?.cards.map((card) => [card.id, card.text]));
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 border-y border-line bg-field px-4 py-2">
        <span className="text-xs font-bold text-muted-foreground">
          Scroll to explore · geometry preserved
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 0.5}
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Reset zoom"
            onClick={() => setZoom(1)}
            className="min-w-12 rounded-lg px-1 py-2 text-xs font-black tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= 2.5}
            onClick={() => setZoom((value) => Math.min(2.5, value + 0.25))}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <div
        className="max-h-[65vh] overflow-auto bg-[#f1f7f4] p-3"
        role="region"
        tabIndex={0}
        aria-label={
          board
            ? "Puzzle diagram. Scroll to explore."
            : "Labelled reference diagram. Scroll to explore."
        }
      >
        <div
          className="relative bg-white"
          style={{
            width: zoom * 100 + "%",
            minWidth: 560 * zoom,
            aspectRatio: width / height,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Frozen SVG data URI must keep its original geometry. */}
          <img
            src={src}
            alt={board ? "Blank lesson diagram" : "Labelled lesson diagram"}
            className="block size-full"
            draggable={false}
          />
          {board?.slots.map((slot, index) => {
            const cardId = placements[slot.id];
            const text = cardId ? cards.get(cardId) : undefined;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={disabled}
                data-slot-id={slot.id}
                onClick={() => onPlace?.(slot.id, selected ?? null)}
                onDragOver={(event) => {
                  if (!disabled) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/plain");
                  if (!disabled && board.cards.some((card) => card.id === id))
                    onPlace?.(slot.id, id);
                }}
                aria-label={`Slot ${index + 1}: ${text ?? "empty"}${wrong.includes(slot.id) ? ", incorrect" : ""}`}
                title={
                  text
                    ? `Slot ${index + 1}: ${text}. Select to return to tray.`
                    : `Slot ${index + 1}`
                }
                className={cn(
                  "absolute flex items-center justify-center overflow-hidden rounded border border-dashed text-center font-extrabold transition-colors",
                  cardId
                    ? "border-solid border-brand bg-brand-soft text-brand-dark"
                    : "border-[#7eaa94] bg-white/80 text-[#617c6c]",
                  selected &&
                    !disabled &&
                    "hover:border-brand hover:bg-brand-soft",
                  wrong.includes(slot.id) &&
                    "border-2 border-destructive bg-[#fdecec] text-destructive",
                )}
                style={{
                  left: ((slot.x - x) / width) * 100 + "%",
                  top: ((slot.y - y) / height) * 100 + "%",
                  width: (slot.width / width) * 100 + "%",
                  height: (slot.height / height) * 100 + "%",
                  fontSize: 12 * zoom,
                }}
              >
                <span className="truncate px-1">{text ?? index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
      {board && (
        <details className="border-t border-line px-4 py-3">
          <summary className="cursor-pointer text-sm font-black text-brand-dark">
            Slot controls · keyboard and touch
          </summary>
          <p className="mt-2 text-xs font-bold text-muted-foreground">
            Choose a card for each numbered slot. Moving a card clears its
            previous slot.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {board.slots.map((slot, index) => (
              <label
                key={slot.id}
                className="flex flex-col gap-1 text-xs font-black"
              >
                <span
                  className={cn(wrong.includes(slot.id) && "text-destructive")}
                >
                  Slot {index + 1}
                  {wrong.includes(slot.id) ? " · incorrect" : ""}
                </span>
                <select
                  value={placements[slot.id] ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    onPlace?.(slot.id, event.target.value || null)
                  }
                  className="h-11 min-w-0 rounded-xl border border-input bg-card px-2 text-sm font-bold"
                >
                  <option value="">Empty</option>
                  {board.cards.map((card, cardIndex) => (
                    <option key={card.id} value={card.id}>
                      {card.text} · card {cardIndex + 1}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function ClearBoardButton({
  disabled,
  onClear,
}: {
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="flex items-center gap-1.5 text-xs font-black text-muted-foreground disabled:opacity-40"
    >
      <RotateCcw className="size-3.5" />
      Clear selection
    </button>
  );
}
