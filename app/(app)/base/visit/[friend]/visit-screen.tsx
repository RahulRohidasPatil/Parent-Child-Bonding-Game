"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Sparkles, Swords, ZoomIn, ZoomOut } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { IsoHouse } from "@/components/qn/iso-house";
import { Face } from "@/components/qn/sprite";
import { Card, EmptyState, Notice, PageHeader, ProgressBar } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { FRIEND_HOMES, MAX_LEVEL, ROOMS, ROOM_GRID, UNLOCK_LEVEL, homeSummary, levelsOf, unlockProgress, type RoomId } from "@/lib/home-data";
import { AVATARS, FAMILY, FRIENDS } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

/** Look around a friend's home (read-only) and see how far they've got. Example data for now. */
export function VisitScreen({ id }: { id: string }) {
  const key = decodeURIComponent(id).toLowerCase();
  const home = FRIEND_HOMES[key];
  const person = [...FRIENDS, ...FAMILY].find((p) => p.name.toLowerCase() === key);
  const [view, setView] = useState<RoomId | null>(null);
  const [cheered, setCheered] = useState<string[]>([]);

  if (!home || !person) {
    return (
      <Page>
        <PageHeader title="Home not found" back={{ href: "/base", label: "Back to my base" }} />
        <EmptyState
          title="We couldn’t find that home"
          action={
            <Link href="/friends" className={cn(buttonVariants({ variant: "brand", size: "pill" }))}>
              See your friends
            </Link>
          }
        >
          It may be private, or this friend hasn’t been approved yet.
        </EmptyState>
      </Page>
    );
  }

  const { built, levels, maxLevels } = homeSummary(home);
  const newest = built[built.length - 1];
  const room = built.find((r) => r.id === view) ?? null;
  const roomLevels = room ? levelsOf(room, home.rooms[room.id]) : [];
  const placed = roomLevels.filter((l) => l > 0).length;
  const cheerKey = room?.id ?? "home";
  const next = ROOMS[built.length];
  const unlock = unlockProgress(newest, levelsOf(newest, home.rooms[newest.id]));
  const tint = AVATARS.find((a) => a.id === person.avatar)?.tint;

  return (
    <Page wide>
      <PageHeader
        title={`${person.name}’s home`}
        sub={`${built.length} ${built.length === 1 ? "room" : "rooms"} · ${levels} of ${maxLevels} levels`}
        back={{ href: "/base", label: "Back to my base" }}
        right={<Face id={person.avatar} size={52} tint={tint} alt={person.name} />}
      />
      <Notice tone="info">Preview: friends’ homes need backend support, so this home is an example.</Notice>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card className="overflow-hidden">
          <div className="relative isolate h-[min(62dvh,560px)] min-h-[380px] bg-[#c3eef5]">
            <IsoHouse
              rooms={built.map((r) => ({ room: r, levels: levelsOf(r, home.rooms[r.id]), layout: home.layout?.[r.id], grid: ROOM_GRID[r.id] }))}
              focus={room ? built.indexOf(room) : null}
              onFocus={(r) => setView(built[r].id)}
              className="absolute inset-0 h-full"
              priority
            />
            <span className="absolute top-3 left-3 z-10 flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-sm font-black whitespace-nowrap">
              <Sparkles className="size-4 text-[#f5b93a]" />
              {room ? `${room.name} · ${placed} of ${room.items.length} placed` : `${built.length} ${built.length === 1 ? "room" : "rooms"}`}
            </span>
            <Button
              variant="soft"
              size="icon-lg"
              className="absolute top-3 right-3 z-10 size-9 rounded-full"
              onClick={() => setView(room ? null : newest.id)}
              aria-label={room ? "Zoom out to see the whole home" : `Zoom in to the ${newest.name.toLowerCase()}`}
            >
              {room ? <ZoomOut /> : <ZoomIn />}
            </Button>
            {!room && <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/90 px-3.5 py-1.5 text-[13px] font-extrabold whitespace-nowrap">Tap a room to look inside</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 p-4">
            <Button variant={cheered.includes(cheerKey) ? "brandSoft" : "brand"} size="pill" onClick={() => setCheered((c) => (c.includes(cheerKey) ? c : [...c, cheerKey]))} disabled={cheered.includes(cheerKey)}>
              <Heart className={cn(cheered.includes(cheerKey) && "fill-current")} /> {cheered.includes(cheerKey) ? "Cheer sent" : "Send a cheer"}
            </Button>
            <Link href="/play/duel" className={cn(buttonVariants({ variant: "soft", size: "pill" }))}>
              <Swords /> Duel {person.name}
            </Link>
            {cheered.includes(cheerKey) && (
              <span className="text-[13px] font-bold text-muted-foreground" role="status">
                {person.name} will see your cheer on their {room ? room.name.toLowerCase() : "home"}.
              </span>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">PROGRESS</span>
            {built.map((r) => {
              const lv = home.rooms[r.id] ?? [];
              const total = lv.reduce((a, b) => a + b, 0);
              return (
                <span key={r.id} className="flex flex-col gap-1.5">
                  <span className="flex justify-between gap-2 text-sm font-extrabold">
                    <span>{r.name}</span>
                    <span className="text-muted-foreground">
                      {total}/{r.items.length * MAX_LEVEL}
                    </span>
                  </span>
                  <ProgressBar value={(total / (r.items.length * MAX_LEVEL)) * 100} className="h-2" />
                </span>
              );
            })}
            <span className="text-[13px] font-bold text-muted-foreground">
              {next
                ? unlock.ready
                  ? `${person.name} can buy the ${next.name.toLowerCase()} next.`
                  : `Working toward the ${next.name.toLowerCase()}: ${unlock.have} of ${unlock.need} items at Lv ${UNLOCK_LEVEL}.`
                : `${person.name} has built every room!`}
            </span>
          </Card>

          {room && (
            <Card className="flex flex-col gap-2 p-4">
              <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">IN THE {room.name.toUpperCase()}</span>
              <ul className="flex flex-col gap-1.5">
                {room.items.map((item, i) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[15px] font-black">
                    <span className={cn(!roomLevels[i] && "text-muted-foreground")}>{item.name}</span>
                    <span className="text-[13px] font-extrabold text-muted-foreground">{roomLevels[i] ? `Lv ${roomLevels[i]}` : "Not yet"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
