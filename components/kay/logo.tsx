import { Blob } from "@/components/splash/blob";
import { APP_NAME } from "@/lib/kay/data";
import { cn } from "@/lib/utils";

/** A grown-up Splashie and a little one, side by side: learning together. */
export function KayLogo({ size = "lg", className }: { size?: "sm" | "lg"; className?: string }) {
  const big = size === "lg";
  return (
    <div className={cn("flex items-center gap-2", big && "flex-col gap-0", className)}>
      <div className={cn("flex items-end", big ? "-mb-2" : "")} aria-hidden>
        <Blob color="coral" size={big ? 84 : 30} accessory="glasses" className="animate-float" />
        <Blob
          color="sky"
          size={big ? 58 : 22}
          accessory={big ? "cap" : "none"}
          className="-ml-3 animate-float [animation-delay:-1.5s]"
        />
      </div>
      <span
        className={cn(
          "font-heading font-bold leading-none tracking-tight",
          big ? "text-7xl [text-shadow:0_4px_0_var(--sun)]" : "text-2xl",
        )}
      >
        {APP_NAME}
      </span>
    </div>
  );
}
