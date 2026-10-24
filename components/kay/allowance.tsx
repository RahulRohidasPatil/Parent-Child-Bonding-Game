import { Zap } from "lucide-react";
import { TODAY } from "@/lib/kay/data";
import { cn } from "@/lib/utils";

/** Daily activity allowance (plan §3): base slots + badge bonus, used/left. */
export function Allowance({ compact, used = TODAY.allowance.used }: { compact?: boolean; used?: number }) {
  const { base, bonus, bonusFrom } = TODAY.allowance;
  const total = base + bonus;
  const left = Math.max(0, total - used);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-heading text-lg font-semibold">
          <Zap className="mr-1 inline size-4 text-sun" aria-hidden />
          {left} of {total} activities left
        </p>
        {!compact && <span className="text-xs font-bold text-muted-foreground">resets at midnight</span>}
      </div>
      <ul className="flex gap-1.5" aria-label={`${used} used, ${left} left`}>
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={cn(
              "h-3 flex-1 rounded-full",
              i < used ? "bg-muted" : i >= base ? "bg-grape" : "bg-sun",
            )}
          />
        ))}
      </ul>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Includes <strong className="text-foreground">+{bonus} bonus</strong> from your{" "}
          <strong className="text-foreground">{bonusFrom}</strong> badge. Lessons never use up activities.
        </p>
      )}
    </div>
  );
}
