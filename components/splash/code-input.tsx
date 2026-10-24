"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { normalizeCode } from "@/lib/profile";

/** Four big letter tiles backed by one real input (paste, autofill and screen readers just work). */
export function CodeInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div className="group relative">
      <label htmlFor={id} className="sr-only">
        Room code
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(normalizeCode(e.target.value))}
        autoFocus={autoFocus}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        maxLength={4}
        className="absolute inset-0 z-10 w-full cursor-text opacity-0"
      />
      <div className="grid grid-cols-4 gap-3" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => {
          const char = value[i];
          const active = i === Math.min(value.length, 3);
          return (
            <div
              key={i}
              className={cn(
                "grid aspect-square place-items-center rounded-2xl border-2 border-input bg-card font-heading text-4xl font-bold transition",
                char && "border-sun/60 bg-sun/10 animate-pop",
                active && "group-focus-within:border-sun group-focus-within:ring-4 group-focus-within:ring-sun/25",
              )}
            >
              {char ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
