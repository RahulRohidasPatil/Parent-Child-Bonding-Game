"use client";

import { useState } from "react";
import { useClientValue } from "@/lib/use-client-value";
import Link from "next/link";
import { ChevronRight, Pencil } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { IsoHouse } from "@/components/qn/iso-house";
import { Face, Sprite, Stage } from "@/components/qn/sprite";
import { Notice, ProgressBar, StatChips } from "@/components/qn/ui";
import { useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";
import { QUESTS, subjectOf } from "@/lib/qn-data";
import { ROOMS, ROOM_GRID, UNLOCK_LEVEL, levelsOf, unlockProgress } from "@/lib/home-data";

export function HomeScreen() {
  const { user } = useUser();
  const look = useQN((s) => s.look);
  const pet = useQN((s) => s.pet);
  const recent = useQN((s) => s.recent);
  const progress = useQN((s) => s.progress);
  const claimed = useQN((s) => s.claimed);
  const homeRooms = useQN((s) => s.home.rooms);
  const homeLayout = useQN((s) => s.home.layout);
  const streak = useQN((s) => s.streakDays);
  const day = useClientValue(() => new Date().toLocaleDateString("en-GB", { weekday: "long" }), "");
  const welcomeParam = useClientValue(() => new URLSearchParams(window.location.search).get("welcome") === "1", false);
  const [dismissed, setDismissed] = useState(false);
  const welcome = welcomeParam && !dismissed;

  const lessons = recent.filter((r) => r.kind === "lesson");
  const latest = lessons[0];
  const daily = QUESTS.filter((q) => q.kind === "daily");
  const doneDaily = daily.filter((q) => (progress[q.id] ?? 0) >= q.of || claimed.includes(q.id)).length;
  const built = ROOMS.filter((r) => homeRooms[r.id]);
  const newest = built[built.length - 1] ?? ROOMS[0];
  const nextRoom = ROOMS[built.length];
  const unlock = unlockProgress(newest, levelsOf(newest, homeRooms[newest.id]));
  const first = user?.name?.split(" ")[0] ?? "";

  return (
    <Page wide>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h1 className="text-[26px] font-black md:text-[28px]">Hi{first ? `, ${first}` : ""}</h1>
          <p className="text-[14px] font-bold text-muted-foreground md:text-[15px]">
            {day && `${day} · `}
            {lessons.length ? `${lessons.length} lesson${lessons.length === 1 ? "" : "s"} on the go` : "Let’s start your first lesson"}
          </p>
        </div>
        <StatChips />
      </div>

      {welcome && (
        <Notice tone="ok" onClose={() => setDismissed(true)}>
          Your account is active. Welcome to QuestNest!
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[360px_minmax(0,1fr)_330px] xl:gap-5">
        {/* avatar */}
        <Stage className="flex min-h-[400px] flex-col md:col-start-1 md:row-span-2 md:row-start-1 md:min-h-[440px] xl:min-h-[560px]">
          {/* speech bubble and Customize sit above the avatar, never on top of it */}
          <div className="relative z-10 flex items-start justify-between gap-2 p-4">
            <div className="max-w-[240px] min-w-0 rounded-[18px_18px_18px_4px] bg-card px-3.5 py-3 text-[15px] leading-snug font-bold">
              {streak > 1 ? `${streak}-day streak! Ready for the next lesson?` : latest ? `Want to keep going with ${latest.title}?` : "Snap a page of notes and I’ll turn it into a lesson."}
            </div>
            <Link href="/profile" aria-label="Customize your avatar" className="flex size-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-card text-sm font-black sm:w-auto sm:px-3.5">
              <Pencil className="size-[15px]" strokeWidth={2.4} />
              <span className="hidden sm:inline">Customize</span>
            </Link>
          </div>
          <div className="relative min-h-[250px] flex-1">
            <div className="absolute bottom-7 left-1/2 h-7 w-[240px] -translate-x-1/2 rounded-[50%] bg-stage-floor xl:bottom-12" />
            {/* the avatar scales with the space left; the cat stays at its feet */}
            <div className="absolute bottom-7 left-1/2 aspect-square h-[calc(100%-1.75rem)] max-h-[384px] -translate-x-1/2 xl:bottom-12 xl:h-[calc(100%-3rem)]">
              <Sprite id={look} alt="Your avatar" className="h-full w-full" />
              {pet && <Sprite id="cat" alt="Mochi the cat" className="absolute bottom-0 left-[69%] h-auto w-[20%]" />}
            </div>
          </div>
        </Stage>

        {/* continue */}
        <Link href={latest ? `/learn/lesson/${latest.id}` : "/learn/new"} className="flex flex-col gap-2.5 rounded-3xl bg-brand p-5 text-white md:col-start-2 md:row-start-1">
          <span className="text-[13px] font-black tracking-[.04em] text-[#d6f3e6] uppercase">
            {latest ? (latest.subject ? `Continue · ${subjectOf(latest.subject).label}` : "Continue") : "Start here"}
          </span>
          <span className="text-[26px] leading-tight font-black md:text-[30px]">{latest ? latest.title : "Make your first lesson"}</span>
          <span className="text-[15px] font-bold text-[#d6f3e6]">
            {latest ? latest.detail || "Read the lesson, then try the quiz and flashcards." : "Ask for a quick explanation or upload your notes. We’ll explain it at your level."}
          </span>
          <span className="mt-1.5 flex items-center gap-3.5">
            <span className="h-2.5 flex-1 rounded-full bg-white/25">
              <span className="block h-full rounded-full bg-[#ffd36b]" style={{ width: `${Math.round((doneDaily / daily.length) * 100)}%` }} />
            </span>
            <span className="flex h-11 items-center rounded-xl bg-white px-5 text-base font-black text-brand-dark">{latest ? "Continue" : "Start"}</span>
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-4 md:col-start-2 md:row-start-2">
          <Link href="/play/duel" className="relative flex min-h-[170px] flex-col gap-1.5 overflow-hidden rounded-3xl bg-rose p-4">
            <span className="text-[13px] font-black text-rose-ink">FAMILY DUEL</span>
            <span className="text-[19px] leading-tight font-black md:text-[21px]">Duel on one phone</span>
            <span className="mt-auto flex h-9 items-center self-start rounded-xl bg-rose-strong px-3.5 text-sm font-black text-white">Play</span>
            <span className="absolute right-3 bottom-4 flex" aria-hidden="true">
              <Face id={look} size={40} ring="#fff" />
              <Face id="mom" size={40} tint="#fff" ring="#fff" className="-ml-2.5" />
            </span>
          </Link>
          <Link href="/quests" className="flex min-h-[170px] flex-col gap-2 rounded-3xl border border-line bg-card p-4">
            <span className="text-[13px] font-black text-muted-foreground">TODAY’S QUESTS</span>
            <span className="text-[20px] font-black">
              {doneDaily} of {daily.length} done
            </span>
            <span className="mt-auto grid grid-cols-4 gap-1.5">
              {daily.map((q, i) => (
                <span key={q.id} className={i < doneDaily ? "h-2 rounded-full bg-brand" : "h-2 rounded-full bg-[#e9eef1]"} />
              ))}
            </span>
          </Link>
        </div>

        {/* right column */}
        <Link href="/base" className="flex flex-col overflow-hidden rounded-3xl border border-line bg-card md:col-span-2 md:row-start-3 md:flex-row xl:col-span-1 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:flex-col">
          <span className="flex items-center justify-center bg-[#c3eef5] p-3 md:w-[260px] xl:w-full xl:flex-1">
            <IsoHouse rooms={built.map((r) => ({ room: r, levels: levelsOf(r, homeRooms[r.id]), layout: homeLayout[r.id], grid: ROOM_GRID[r.id] }))} focus={null} aspect={1.25} className="max-w-[320px]" />
          </span>
          <span className="flex flex-1 flex-col justify-center gap-1.5 p-4 xl:flex-none">
            <span className="flex items-center justify-between text-[18px] font-black">
              My base <ChevronRight className="size-5 text-muted-foreground" />
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              {built.length} {built.length === 1 ? "room" : "rooms"}
              {nextRoom ? (unlock.ready ? ` · ${nextRoom.name} ready to buy` : ` · ${unlock.have}/${unlock.need} items at Lv ${UNLOCK_LEVEL} for the ${nextRoom.name.toLowerCase()}`) : " · all built"}
            </span>
            <ProgressBar value={nextRoom ? (unlock.have / unlock.need) * 100 : 100} className="h-2" />
          </span>
        </Link>
      </div>

    </Page>
  );
}
