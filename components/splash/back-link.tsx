import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackLink({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(buttonVariants({ variant: "glass", size: "icon-lg" }), "size-11 rounded-full")}
    >
      <ArrowLeft className="size-5" />
    </Link>
  );
}
