"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Circular countdown to `endsAt` (epoch ms). Turns coral in the last 10s. */
export function TimerRing({
  endsAt,
  totalSeconds,
  size = 168,
}: {
  endsAt: number;
  totalSeconds: number;
  size?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const progress = Math.min(1, left / totalSeconds);
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const urgent = left <= 10;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn("transition-[stroke-dashoffset] duration-300", urgent ? "stroke-coral" : "stroke-sun")}
        />
      </svg>
      <div className="text-center" role="timer" aria-live="off">
        <div key={urgent ? left : "calm"} className={cn("font-heading text-5xl font-bold tabular-nums", urgent && "text-coral animate-wiggle")}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">left to chat</div>
      </div>
    </div>
  );
}
