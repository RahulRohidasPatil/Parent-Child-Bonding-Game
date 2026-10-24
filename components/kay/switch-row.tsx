"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Labelled on/off row built on a native checkbox with role="switch". */
export function SwitchRow({
  label,
  hint,
  icon,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 py-2.5">
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-lg" aria-hidden>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-tight">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full bg-input transition-colors",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
          "after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-card after:shadow after:transition-transform",
          checked && "bg-primary after:translate-x-5",
        )}
      />
    </label>
  );
}
