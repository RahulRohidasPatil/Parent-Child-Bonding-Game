import { cn } from "@/lib/utils";
import { Blob } from "./blob";

export function Logo({ size = "lg", className }: { size?: "sm" | "lg"; className?: string }) {
  const big = size === "lg";
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className={cn("relative flex items-end", big ? "-mb-3" : "-mb-1")}>
        <Blob color="coral" size={big ? 54 : 26} className="-mr-3 -rotate-12 animate-float [animation-delay:-1s]" />
        <Blob color="sun" mood="sus" size={big ? 80 : 36} className="relative z-10 animate-float" />
        <Blob color="mint" size={big ? 54 : 26} className="-ml-3 rotate-12 animate-float [animation-delay:-2s]" />
      </div>
      <span
        className={cn(
          "font-heading font-bold leading-none tracking-tight text-foreground",
          "[text-shadow:0_4px_0_var(--grape)]",
          big ? "text-7xl" : "text-2xl [text-shadow:0_2px_0_var(--grape)]",
        )}
      >
        Splash
      </span>
      {big && (
        <span className="mt-3 rounded-full bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          The Imposter Game
        </span>
      )}
    </div>
  );
}
