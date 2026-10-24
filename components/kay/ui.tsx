import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Blob, type BlobMood } from "@/components/splash/blob";
import type { Person } from "@/lib/kay/data";
import { cn } from "@/lib/utils";

/** Mobile-first page column. `nav` leaves room for the bottom tab bar. */
export function Page({
  title,
  back,
  actions,
  footer,
  nav = true,
  children,
  className,
}: {
  title?: React.ReactNode;
  back?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  nav?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hasTop = title || back || actions;
  return (
    <div className={cn("mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))]", nav && "pb-24")}>
      {hasTop && (
        <header className="flex min-h-14 items-center gap-3">
          {back && (
            <Link
              href={back}
              aria-label="Back"
              className={cn(buttonVariants({ variant: "glass", size: "icon-lg" }), "size-11 shrink-0 rounded-full")}
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          {title && <h1 className="min-w-0 flex-1 truncate font-heading text-2xl font-semibold">{title}</h1>}
          {!title && !actions && <span className="flex-1" />}
          {actions}
        </header>
      )}
      <main className={cn("flex flex-1 flex-col gap-5 py-3", className)}>{children}</main>
      {footer && (
        <footer
          className={cn(
            "sticky -mx-4 flex flex-col gap-2 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))]",
            nav ? "bottom-20" : "bottom-0",
          )}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl border bg-card p-4 text-card-foreground shadow-[0_6px_24px_-14px_color-mix(in_oklch,var(--foreground)_45%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export function SectionHead({
  title,
  href,
  linkLabel = "See all",
  className,
}: {
  title: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-bold text-primary underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-extrabold uppercase tracking-[0.16em] text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Pill({
  tone = "muted",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: "muted" | "sun" | "mint" | "coral" | "grape" | "sky" }) {
  const tones = {
    muted: "bg-muted text-muted-foreground",
    sun: "bg-sun text-ink",
    mint: "bg-mint text-ink",
    coral: "bg-coral text-ink",
    grape: "bg-grape text-ink",
    sky: "bg-sky text-ink",
  };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold", tones[tone], className)}
      {...props}
    />
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = "primary",
  className,
}: {
  value: number;
  max?: number;
  label: string;
  tone?: "primary" | "sun" | "mint" | "coral" | "sky" | "grape" | "pink";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = {
    primary: "bg-primary",
    sun: "bg-sun",
    mint: "bg-mint",
    coral: "bg-coral",
    sky: "bg-sky",
    grape: "bg-grape",
    pink: "bg-pink",
  }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular progress (e.g. today's minutes). */
export function Ring({
  value,
  max,
  size = 96,
  children,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  children?: React.ReactNode;
  label: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="stroke-sun transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="relative text-center" aria-hidden>
        {children}
      </div>
    </div>
  );
}

export function Avatar({
  person,
  size = 48,
  mood,
  className,
}: {
  person: Pick<Person, "color" | "accessory" | "name">;
  size?: number;
  mood?: BlobMood;
  className?: string;
}) {
  return (
    <Blob
      color={person.color}
      accessory={person.accessory}
      mood={mood}
      size={size}
      className={className}
    />
  );
}

export const roleLabel = (role: Person["role"]) =>
  role === "parent" ? "Parent" : role === "kid" ? "Kid" : "Learner";
