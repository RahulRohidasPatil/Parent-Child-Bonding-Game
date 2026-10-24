"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpCircle, Sparkles } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Card, Coin, Notice, PageHeader, ProgressBar, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { ROOM_ITEMS, SUBJECTS, TIER_UP_COST, UPGRADE_COST, type Subject } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Each subject is a room with six items, levelled 1–10 with coins. Looks only. */
export function BaseScreen() {
  const [subject, setSubject] = useState<Subject>("science");
  const base = useQN((s) => s.base);
  const coins = useQN((s) => s.coins);
  const [note, setNote] = useState<string | null>(null);
  const room = base[subject];
  const total = room.levels.reduce((a, b) => a + b, 0);
  const maxed = total >= 60;
  const info = SUBJECTS.find((s) => s.id === subject)!;
  const img = room.tier >= 2 && subject === "science" ? "/qn/rooms/science-tier2.jpg" : `/qn/rooms/${subject}.jpg`;

  function levelUp(i: number) {
    const lv = room.levels[i];
    if (lv >= 10) return;
    const cost = UPGRADE_COST(lv + 1);
    if (coins < cost) return setNote(`You need ${cost} coins. Earn more with quizzes, flashcards and duels.`);
    setNote(null);
    const levels = room.levels.map((l, j) => (j === i ? l + 1 : l));
    setState((s) => ({ coins: s.coins - cost, base: { ...s.base, [subject]: { ...s.base[subject], levels } } }));
  }

  function tierUp() {
    if (coins < TIER_UP_COST) return setNote(`Tier ${room.tier + 1} costs ${TIER_UP_COST.toLocaleString("en-US")} coins.`);
    setState((s) => ({ coins: s.coins - TIER_UP_COST, base: { ...s.base, [subject]: { tier: room.tier + 1, levels: [1, 1, 1, 1, 1, 1] } } }));
  }

  return (
    <Page wide>
      <PageHeader title="My base" sub="Every subject is a room you build up" right={<StatChips />} />
      <div role="tablist" aria-label="Rooms" className="flex gap-2 overflow-x-auto pb-1">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={s.id === subject}
            onClick={() => {
              setSubject(s.id);
              setNote(null);
            }}
            className={cn(
              "h-10 shrink-0 rounded-xl px-3.5 text-sm font-black whitespace-nowrap",
              s.id === subject ? "bg-night text-white" : "border border-line bg-card hover:bg-muted",
            )}
          >
            {s.room} · T{base[s.id].tier}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <Card className="overflow-hidden">
          <div className="relative bg-[#c3eef5]">
            <Image src={img} alt={`${info.room}, tier ${room.tier}`} width={1252} height={1026} className="mx-auto h-[280px] w-auto object-contain md:h-[420px] lg:h-[520px]" priority />
            <span className="absolute bottom-3 left-1/2 flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/95 px-3.5 text-sm font-black whitespace-nowrap">
              <Sparkles className="size-4 text-[#f5b93a]" /> {info.room} · Tier {room.tier} · {total}/60
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-4">
            <span className="flex justify-between text-sm font-extrabold">
              <span>Room level</span>
              <span>{total}/60 toward Tier {room.tier + 1}</span>
            </span>
            <ProgressBar value={(total / 60) * 100} />
            <span className="text-[13px] font-bold text-muted-foreground">Looks only: upgrades never change quiz scores.</span>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          {maxed && (
            <Card className="flex flex-col gap-2.5 border-brand bg-brand-soft p-4">
              <span className="text-[17px] font-black">Room maxed! Tier {room.tier + 1} is ready</span>
              <span className="text-sm font-bold text-[#1d4d3b]">A bigger room with new walls and floor. Your items start again at Lv 1.</span>
              <Button variant="brand" size="pill" onClick={tierUp}>
                <Coin /> Upgrade · {TIER_UP_COST.toLocaleString("en-US")}
              </Button>
            </Card>
          )}
          <ul className="flex flex-col gap-2.5">
            {ROOM_ITEMS[subject].map((name, i) => {
              const lv = room.levels[i];
              const cost = UPGRADE_COST(lv + 1);
              return (
                <li key={name}>
                  <Card className="flex items-center gap-3 p-3">
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2 text-[15px] font-black">
                        {name}
                        <span className="text-[13px] font-extrabold text-muted-foreground">Lv {lv}</span>
                      </span>
                      <ProgressBar value={lv * 10} className="h-2" />
                    </span>
                    {lv >= 10 ? (
                      <span className="w-[104px] text-center text-sm font-black text-brand">Maxed</span>
                    ) : (
                      <Button variant="brand" size="pill" onClick={() => levelUp(i)} className="w-[104px] px-2.5" aria-label={`Level up ${name} for ${cost} coins`}>
                        <ArrowUpCircle /> {cost}
                      </Button>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
          {note && <Notice tone="warn" onClose={() => setNote(null)}>{note}</Notice>}
          <Link href="/friends" className="text-center text-sm font-black text-brand-ink">
            Visit your friends’ bases
          </Link>
        </div>
      </div>
    </Page>
  );
}
