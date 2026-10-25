import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarTile({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-[30%] bg-brand shadow-[0_3px_0_0_var(--brand-depth)]", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Star className="fill-[#ffd36b] text-[#ffd36b]" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={1.5} />
    </span>
  );
}

export function Logo({ href = "/", size = 40, className, label = true }: { href?: string; size?: number; className?: string; label?: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)} aria-label="QuestNest home">
      <StarTile size={size} />
      {label && <span className="text-[21px] font-black tracking-tight">QuestNest</span>}
    </Link>
  );
}
