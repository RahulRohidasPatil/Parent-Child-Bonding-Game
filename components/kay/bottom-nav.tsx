"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Gift, Home, Swords, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "Today", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/compete", label: "Compete", icon: Swords },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/me", label: "Me", icon: UserRound },
];

/** Focused, full-screen flows hide the tab bar. */
const FOCUS_ROUTES = [/^\/compete\/match/, /^\/learn\/[^/]+\/(quiz|flashcards)/];

export function BottomNav() {
  const pathname = usePathname();
  if (FOCUS_ROUTES.some((r) => r.test(pathname))) return null;
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid h-20 max-w-lg grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
                  active && "text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors",
                    active && "bg-sun text-ink",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
