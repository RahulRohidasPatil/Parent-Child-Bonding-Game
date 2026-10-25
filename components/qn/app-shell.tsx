"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessagesSquare, Gamepad2, Home, Settings, ShoppingBag, Users, Box, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";
import { AVATARS } from "@/lib/qn-data";
import { StarTile } from "./brand";
import { Presence } from "./presence";
import { Face } from "./sprite";

type NavItem = { href: string; label: string; icon: typeof Home; match?: string[] };

const HOME: NavItem = { href: "/home", label: "Home", icon: Home };
const LEARN: NavItem = { href: "/learn", label: "Learn", icon: BookOpen, match: ["/learn"] };
const SCAN: NavItem = { href: "/learn/new", label: "Chat", icon: MessagesSquare };
const PLAY: NavItem = { href: "/play", label: "Play", icon: Gamepad2 };
const BASE: NavItem = { href: "/base", label: "Base", icon: Box };
const SHOP: NavItem = { href: "/shop", label: "Shop", icon: ShoppingBag };
const FRIENDS: NavItem = { href: "/friends", label: "Friends", icon: Users };
const QUESTS: NavItem = { href: "/quests", label: "Quests", icon: CircleCheck };

function isActive(path: string, item: NavItem) {
  if (item === LEARN) return path === "/learn" || (path.startsWith("/learn/") && !path.startsWith("/learn/new"));
  return path === item.href || path.startsWith(`${item.href}/`);
}

/*
 * The current path is request data for dynamic routes, so every path-aware piece of the
 * shell sits behind <Suspense> with a fallback that renders the same nav unhighlighted.
 */
function WithPath({ render }: { render: (path: string) => React.ReactNode }) {
  return <>{render(usePathname())}</>;
}
function PathAware({ render }: { render: (path: string) => React.ReactNode }) {
  return (
    <Suspense fallback={render("")}>
      <WithPath render={render} />
    </Suspense>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return (
    <div className="flex min-h-dvh w-full">
      <a href="#content" className="sr-only z-50 rounded-xl bg-card px-4 py-2 font-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <PathAware render={(path) => <Rail path={path} />} />
      <PathAware render={(path) => <Sidebar path={path} />} />
      <main key={user?.id ?? "signed-out"} id="content" className="flex min-w-0 flex-1 flex-col pb-28 md:pb-8">
        {children}
      </main>
      <PathAware render={(path) => <TabBar path={path} />} />
      <Presence />
    </div>
  );
}

function useLook() {
  const look = useQN((s) => s.look);
  return { look, tint: AVATARS.find((a) => a.id === look)?.tint };
}

function Rail({ path }: { path: string }) {
  const { look, tint } = useLook();
  return (
    <>
      {/* Tablet rail (md to xl) */}
      <aside className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col items-center gap-1.5 border-r border-line bg-card px-2 py-5 md:flex xl:hidden">
        <Link href="/home" aria-label="QuestNest home" className="mb-3">
          <StarTile size={44} />
        </Link>
        <nav aria-label="Main" className="flex flex-col items-center gap-1.5">
          {[HOME, LEARN, SCAN, PLAY, BASE, SHOP, FRIENDS].map((item) =>
            item === SCAN ? (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(path, item) ? "page" : undefined}
                className="flex h-[78px] w-[78px] flex-col items-center justify-center gap-1 text-xs font-black"
              >
                <span
                  className={cn(
                    "flex size-[52px] items-center justify-center rounded-full bg-brand text-white shadow-[0_4px_10px_rgba(46,138,105,.35)]",
                    isActive(path, item) && "ring-4 ring-brand-soft",
                  )}
                >
                  <MessagesSquare className="size-6" strokeWidth={2.2} />
                </span>
                Chat
              </Link>
            ) : (
              <RailLink key={item.href} item={item} active={isActive(path, item)} />
            ),
          )}
        </nav>
        <span className="flex-1" />
        <Link
          href="/profile"
          aria-label="Profile"
          aria-current={path.startsWith("/profile") ? "page" : undefined}
          className={cn("rounded-full", path.startsWith("/profile") && "ring-3 ring-brand")}
        >
          <Face id={look} size={50} tint={tint} />
        </Link>
        <Link href="/settings" aria-label="Settings" className="mt-1 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
          <Settings className="size-5" />
        </Link>
      </aside>
    </>
  );
}

function Sidebar({ path }: { path: string }) {
  const { look, tint } = useLook();
  const { user } = useUser();
  return (
    <>
      {/* Desktop sidebar (xl and up) */}
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-1 border-r border-line bg-card px-4 py-6 xl:flex">
        <Link href="/home" className="flex items-center gap-2.5 px-2 pb-5">
          <StarTile size={38} />
          <span className="text-xl font-black">QuestNest</span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {[HOME, LEARN, PLAY, BASE, SHOP, FRIENDS, QUESTS].map((item) => {
            const on = isActive(path, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-[46px] items-center gap-3 rounded-xl px-3 text-[15px]",
                  on ? "bg-brand-soft font-black text-brand-dark" : "font-extrabold text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-[22px]" strokeWidth={2.1} />
                {item === BASE ? "My base" : item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/learn/new"
          aria-current={isActive(path, SCAN) ? "page" : undefined}
          className={cn(
            "mt-3.5 flex h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-brand text-base font-black text-white shadow-[0_4px_0_0_var(--brand-depth)]",
            isActive(path, SCAN) && "ring-3 ring-ring",
          )}
        >
          <MessagesSquare className="size-[22px]" strokeWidth={2.2} />
          Chat
        </Link>
        <span className="flex-1" />
        <Link
          href="/settings"
          aria-current={path.startsWith("/settings") ? "page" : undefined}
          className={cn("flex items-center gap-2.5 rounded-2xl p-2.5", path.startsWith("/settings") ? "bg-brand-soft" : "bg-background hover:bg-muted")}
        >
          <Face id={look} size={40} tint={tint} />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-black">{user?.name ?? "…"}</span>
            <span className="text-xs font-bold text-muted-foreground">{user?.accountType === "parent" ? "Parent" : "Student"}</span>
          </span>
          <Settings className="size-[18px] text-muted-foreground" />
        </Link>
      </aside>
    </>
  );
}

function TabBar({ path }: { path: string }) {
  // Full-screen flows (quiz, flashcards, duel) hide the phone tab bar to give the content room.
  const focus = /^\/play\/(duel|solo)/.test(path);
  return (
    <>
      {/* Phone tab bar (below md) */}
      {!focus && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid h-[84px] grid-cols-5 items-end border-t border-line bg-card px-2 pt-2 pb-[max(18px,env(safe-area-inset-bottom))] md:hidden"
        >
          {[HOME, LEARN, SCAN, PLAY, BASE].map((item) => {
            const on = isActive(path, item);
            const Icon = item.icon;
            if (item === SCAN)
              return (
                <Link key={item.href} href={item.href} aria-label="Chat" aria-current={on ? "page" : undefined} className="flex flex-col items-center gap-0.5 text-xs font-black">
                  <span className="-mt-8 flex size-[62px] items-center justify-center rounded-full border-4 border-card bg-brand text-white shadow-[0_4px_12px_rgba(46,138,105,.35)]">
                    <MessagesSquare className="size-7" strokeWidth={2.2} />
                  </span>
                  Chat
                </Link>
              );
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn("flex flex-col items-center gap-0.5 text-xs", on ? "font-black text-brand-ink" : "font-extrabold text-muted-foreground")}
              >
                <Icon className={cn("size-[26px]", on && "fill-brand-soft")} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

function RailLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 w-[78px] flex-col items-center justify-center gap-[3px] rounded-[14px] text-xs",
        active ? "bg-brand-soft font-black text-brand-dark" : "font-extrabold text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-6" strokeWidth={2.1} />
      {item.label}
    </Link>
  );
}

/** Standard page container: phone gutters 16px, tablet 28px, desktop 32px. */
export function Page({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn("mx-auto flex w-full flex-col gap-5 px-4 pt-4 md:gap-6 md:px-7 md:pt-6 xl:px-8", wide ? "max-w-[1400px]" : "max-w-[1180px]", className)}>
      {children}
    </div>
  );
}
