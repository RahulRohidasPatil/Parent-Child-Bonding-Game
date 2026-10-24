"use client";

import { useState } from "react";
import { Wrench, X } from "lucide-react";
import { Segmented } from "@/components/splash/segmented";
import type { ImposterMode, Room } from "@/lib/game/mock-room";
import { PHASES } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SPLASH_DEV === "1";

/** Design-review helper: jump to any phase and choose who the imposter is. */
export function DevPanel({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  if (!ENABLED) return null;

  return (
    <div className="fixed top-[max(1.25rem,env(safe-area-inset-top))] left-[4.5rem] z-50 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close dev panel" : "Open dev panel"}
        className="grid size-9 place-items-center rounded-full border border-white/15 bg-black/50 text-muted-foreground backdrop-blur hover:text-foreground"
      >
        {open ? <X className="size-4" /> : <Wrench className="size-4" />}
      </button>
      {open && (
        <div className="w-64 rounded-2xl border border-white/15 bg-black/80 p-3 text-sm backdrop-blur animate-pop">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Jump to phase</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => room.dev.jump(p)}
                className={cn(
                  "rounded-lg bg-white/8 px-2 py-1.5 font-bold capitalize hover:bg-white/15",
                  room.state.phase === p && "bg-sun text-ink hover:bg-sun",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="mt-3 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Imposter (next deal)
          </p>
          <Segmented<ImposterMode>
            name="imposter-mode"
            value={room.dev.imposterMode}
            onChange={room.dev.setImposterMode}
            options={[
              { value: "random", label: "Random" },
              { value: "me", label: "Me" },
              { value: "not-me", label: "Not me" },
            ]}
          />
        </div>
      )}
    </div>
  );
}
