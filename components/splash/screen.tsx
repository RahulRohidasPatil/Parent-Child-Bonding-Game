import { cn } from "@/lib/utils";

/**
 * Mobile-first page shell. Every Splash screen is a single column with an
 * optional top bar, scrollable body and a thumb-reachable action footer.
 */
export function Screen({
  top,
  footer,
  children,
  className,
}: {
  top?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {top && <header className="flex min-h-12 items-center justify-between gap-3">{top}</header>}
      <main className={cn("flex flex-1 flex-col py-4", className)}>{children}</main>
      {footer && (
        <footer className="sticky bottom-0 -mx-4 flex flex-col gap-3 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-card/80 p-5 shadow-[0_10px_30px_-12px_oklch(0_0_0/60%)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground", className)}
      {...props}
    />
  );
}
