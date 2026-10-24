"use client";

import { cn } from "@/lib/utils";

/** Pill-style single choice built on native radios. */
export function Segmented<T extends string | number>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-muted p-1.5">
      {options.map((o) => (
        <label
          key={String(o.value)}
          className={cn(
            "flex h-11 cursor-pointer items-center justify-center rounded-xl font-heading text-base font-semibold text-muted-foreground transition",
            "has-focus-visible:ring-3 has-focus-visible:ring-ring/60",
            value === o.value && "bg-foreground text-background",
          )}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === o.value}
            onChange={() => onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
