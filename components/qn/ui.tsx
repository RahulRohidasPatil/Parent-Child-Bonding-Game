"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, Info, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQN } from "@/lib/store";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-3xl border border-line bg-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-[13px] font-black tracking-[.06em] text-brand-ink uppercase", className)}>{children}</span>;
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[13px] font-black whitespace-nowrap", className)}>
      {children}
    </span>
  );
}

export function Coin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#f5b93a" />
      <circle cx="10" cy="10" r="6" fill="none" stroke="#d48f15" strokeWidth="1.6" />
    </svg>
  );
}

export function Flame({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 20 24" aria-hidden="true">
      <path d="M10 1c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-6 1-9z" fill="#f2742e" />
      <path d="M10 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2.5 2-3 0 1 .5 1.5 1 1.5 0-1.2-.2-2.3 0-3.5z" fill="#ffc53d" />
    </svg>
  );
}

/**
 * Coins + streak chips. The wallet balance comes from the backend for every screen.
 */
export function StatChips({ className, home }: { className?: string; home?: boolean }) {
  const homeCoins = useQN((s) => s.serverCoins ?? s.homeMeta?.coins ?? null);
  const streak = useQN((s) => s.streakDays);
  const coins = homeCoins;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href={home ? "/base" : "/shop"} className="flex h-10 items-center gap-1.5 rounded-full bg-coin pr-3 pl-2 text-[15px] font-black text-coin-ink">
        <Coin />
        {coins === null ? "–" : coins.toLocaleString("en-US")}
        <span className="sr-only">{" coins"}</span>
      </Link>
      <Link href="/quests" className="flex h-10 items-center gap-1.5 rounded-full bg-flame pr-3 pl-2.5 text-[15px] font-black text-flame-ink">
        <Flame />
        {streak} {streak === 1 ? "day" : "days"}
        <span className="sr-only"> streak</span>
      </Link>
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  back,
  right,
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  back?: { href: string; label: string };
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {back && (
        <Link
          href={back.href}
          aria-label={back.label}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card hover:bg-muted"
        >
          <ChevronLeft className="size-5" strokeWidth={2.6} />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <h1 className="text-[24px] font-black md:text-[28px]">{title}</h1>
        {sub && <p className="text-[14px] font-bold text-muted-foreground md:text-[15px]">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Text input with label and error, styled like the mockups. */
export function Field({
  label,
  hint,
  error,
  className,
  labelExtra,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | false;
  labelExtra?: React.ReactNode;
}) {
  const id = useId();
  const errId = `${id}-err`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-extrabold text-muted-foreground">
          {label}
        </label>
        {labelExtra}
      </div>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={cn(
          "h-[52px] w-full rounded-2xl border-[1.5px] bg-field px-3.5 text-base font-bold text-foreground outline-none placeholder:font-semibold placeholder:text-muted-foreground focus-visible:border-brand",
          error ? "border-destructive" : "border-input",
        )}
        {...input}
      />
      {error ? (
        <span id={errId} className="text-[13px] font-extrabold text-destructive">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[13px] font-bold text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("grid gap-1 rounded-2xl bg-muted p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-xl px-1 text-[13px] leading-tight font-black transition-colors sm:text-[14px]",
              size === "lg" ? "h-11" : "h-10",
              on ? "bg-card shadow-[0_1px_3px_rgba(31,45,58,.14)]" : "text-muted-foreground hover:bg-card/50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Notice({
  tone = "error",
  children,
  onClose,
  className,
}: {
  tone?: "error" | "info" | "warn" | "ok";
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  const styles = {
    error: "bg-danger-soft text-danger-ink",
    info: "bg-sky-soft text-sky-ink",
    warn: "bg-warn text-warn-ink",
    ok: "bg-brand-soft text-brand-dark",
  }[tone];
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-2xl px-3.5 py-3 text-[14px] font-bold leading-snug", styles, className)}>
      <Icon className="mt-0.5 size-[18px] shrink-0" strokeWidth={2.4} />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-m-1 rounded-lg p-1 hover:bg-black/5">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Shown while the model works (10–40 s per call): elapsed time keeps it honest. */
export function Working({ title, steps, className }: { title: string; steps?: string[]; className?: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const step = steps?.length ? steps[Math.min(steps.length - 1, Math.floor(secs / 8))] : null;
  return (
    <Card className={cn("flex flex-col items-center gap-3 px-6 py-10 text-center", className)} role="status" aria-live="polite">
      <Loader2 className="size-9 animate-spin text-brand-ink motion-reduce:animate-none" strokeWidth={2.6} />
      <span className="text-[18px] font-black">{title}</span>
      {step && <span className="text-[15px] font-bold text-muted-foreground">{step}</span>}
      <span className="text-[13px] font-bold text-muted-foreground">
        {secs}s · this usually takes 10–40 seconds
      </span>
    </Card>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin motion-reduce:animate-none", className)} strokeWidth={2.6} aria-hidden="true" />;
}

export function ProgressBar({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "sun" }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span className={cn("block h-2.5 overflow-hidden rounded-full bg-track", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span className={cn("block h-full rounded-full transition-[width]", tone === "brand" ? "bg-brand" : "bg-[#ffd36b]")} style={{ width: `${pct}%` }} />
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
      <span className="text-[18px] font-black">{title}</span>
      {children && <span className="max-w-md text-[15px] font-bold text-muted-foreground">{children}</span>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
