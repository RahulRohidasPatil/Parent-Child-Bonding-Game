import { Loader2 } from "lucide-react";

/** Fallback while a dynamic page resolves its params. */
export function RouteLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2.5 p-10 text-[15px] font-extrabold text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin text-brand-ink motion-reduce:animate-none" strokeWidth={2.6} />
      {label}
    </div>
  );
}
