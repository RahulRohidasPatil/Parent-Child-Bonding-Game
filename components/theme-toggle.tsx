"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useClientValue } from "@/lib/use-client-value";
import { cn } from "@/lib/utils";

/** Uses the resolved device theme until the user saves a light/dark preference. */
export function ThemeToggle({ expanded = false, className }: { expanded?: boolean; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useClientValue(() => true, false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={isDark}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("flex h-11 shrink-0 cursor-pointer items-center rounded-xl text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait", expanded ? "w-full justify-between gap-3 border border-input bg-card px-3 hover:bg-muted" : "w-[50px] justify-center", className)}
    >
      {expanded && <span className="text-sm font-extrabold">Dark mode</span>}
      <span aria-hidden="true" className="relative h-[30px] w-[50px] shrink-0 rounded-full bg-input transition-colors dark:bg-brand">
        <span className="absolute top-[3px] left-[3px] flex size-6 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-transform dark:translate-x-5">
          <Sun className="size-3.5 dark:hidden" />
          <Moon className="hidden size-3.5 dark:block" />
        </span>
      </span>
    </button>
  );
}
