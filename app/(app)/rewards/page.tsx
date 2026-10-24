"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Eyebrow, Page, Panel, Pill, ProgressBar, SectionHead } from "@/components/kay/ui";
import { BADGES, BOX_DROPS, QUESTS, TODAY } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

const RARITY = {
  common: { label: "Common", tone: "bg-sky/25" },
  rare: { label: "Rare", tone: "bg-grape/30" },
  epic: { label: "Epic", tone: "bg-sun/40" },
} as const;

type BoxState = "closed" | "opening" | "open";

export default function Rewards() {
  const { me } = useSession();
  const [boxes, setBoxes] = useState(2);
  const [box, setBox] = useState<BoxState>("closed");
  const [drop, setDrop] = useState<(typeof BOX_DROPS)[number] | null>(null);

  const openBox = () => {
    if (boxes === 0) return;
    setBox("opening");
    // Illustrative odds only: drop tables are still to be agreed (plan §7e).
    const roll = Math.random();
    const pick = roll < 0.45 ? 0 : roll < 0.75 ? 1 : roll < 0.88 ? 2 : roll < 0.97 ? 3 : 4;
    setTimeout(() => {
      setDrop(BOX_DROPS[pick]);
      setBox("open");
      setBoxes((b) => b - 1);
    }, 1100);
  };

  return (
    <Page title="Rewards">
      <div className="grid grid-cols-2 gap-3">
        <Panel className="flex flex-col gap-1 bg-sun/20">
          <Eyebrow>Points</Eyebrow>
          <p className="font-heading text-4xl font-bold tabular-nums">{TODAY.points}</p>
          <p className="text-sm text-muted-foreground">Spend them on gear</p>
        </Panel>
        <Link href="/rewards/avatar" className="group">
          <Panel className="flex h-full flex-col items-center justify-center gap-1 transition group-hover:bg-accent">
            <Avatar person={me} size={64} />
            <span className="flex items-center gap-1 text-sm font-bold">
              Customise <ArrowRight className="size-4" aria-hidden />
            </span>
          </Panel>
        </Link>
      </div>

      {/* Reward box */}
      <section id="box" aria-labelledby="box-title" className="scroll-mt-4">
        <Panel className="flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-b from-grape/25 to-card text-center">
          <div className="flex w-full items-center justify-between">
            <h2 id="box-title" className="font-heading text-xl font-semibold">
              Reward boxes
            </h2>
            <Pill tone="grape">{boxes} to open</Pill>
          </div>

          {box !== "open" ? (
            <button
              type="button"
              onClick={openBox}
              disabled={boxes === 0 || box === "opening"}
              aria-label={boxes ? "Open a reward box" : "No boxes left"}
              className={cn(
                "my-2 text-[6.5rem] leading-none transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 rounded-3xl disabled:opacity-60",
                box === "opening" && "[animation:kay-shake_550ms_ease-in-out_2]",
                box === "closed" && boxes > 0 && "animate-float",
              )}
            >
              🎁
            </button>
          ) : (
            drop && (
              <div className="my-2 flex flex-col items-center gap-2 animate-pop" role="status">
                <span className={cn("grid size-28 place-items-center rounded-3xl text-6xl", RARITY[drop.rarity].tone)} aria-hidden>
                  {drop.emoji}
                </span>
                <Pill tone={drop.rarity === "epic" ? "sun" : drop.rarity === "rare" ? "grape" : "sky"}>
                  <Sparkles className="size-3" aria-hidden /> {RARITY[drop.rarity].label}
                </Pill>
                <p className="font-heading text-2xl font-bold">{drop.label}</p>
              </div>
            )
          )}

          {box === "open" ? (
            <Button className="h-11 rounded-full px-5" disabled={boxes === 0} onClick={() => setBox("closed")}>
              {boxes ? "Next box" : "All opened!"}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {box === "opening" ? "Opening…" : "Earn boxes by playing matches and finishing quests."}
            </p>
          )}
          <details className="w-full text-left text-sm">
            <summary className="cursor-pointer font-bold text-muted-foreground">What could be inside?</summary>
            <ul className="mt-2 grid grid-cols-2 gap-1.5">
              {BOX_DROPS.map((d) => (
                <li key={d.label} className={cn("rounded-xl px-2 py-1.5", RARITY[d.rarity].tone)}>
                  {d.emoji} {d.label}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Exact odds are shown here once the team agrees them.</p>
          </details>
        </Panel>
      </section>

      {/* Quests */}
      <section className="flex flex-col gap-3">
        <SectionHead title="Quests" />
        {(["daily", "weekly"] as const).map((kind) => (
          <div key={kind} className="flex flex-col gap-2">
            <Eyebrow>{kind === "daily" ? "Daily · ends in 7h 12m" : "Weekly · ends in 2d 7h"}</Eyebrow>
            {QUESTS.filter((q) => q.kind === kind).map((q) => {
              const done = q.progress[0] >= q.progress[1];
              return (
                <Panel key={q.id} className="flex items-center gap-3 p-3.5">
                  <div className="flex-1">
                    <p className="font-bold leading-tight">{q.title}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ProgressBar value={q.progress[0]} max={q.progress[1]} label={q.title} tone="mint" />
                      <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                        {q.progress[0]}/{q.progress[1]}
                      </span>
                    </div>
                  </div>
                  {done ? (
                    <Button variant="mint" className="h-9 rounded-full px-3 font-bold" onClick={() => setBoxes((b) => b + 1)}>
                      Claim
                    </Button>
                  ) : (
                    <Pill>{q.reward}</Pill>
                  )}
                </Panel>
              );
            })}
          </div>
        ))}
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-3">
        <SectionHead title="Badges" />
        <p className="-mt-1 text-sm text-muted-foreground">Some badges unlock extra activities each day.</p>
        <ul className="grid grid-cols-2 gap-3">
          {BADGES.map((b) => (
            <li key={b.id}>
              <Panel className={cn("flex h-full flex-col gap-1.5 p-3.5", !b.earned && "bg-muted/60")}>
                <div className="flex items-start justify-between">
                  <span className={cn("text-4xl", !b.earned && "opacity-40 grayscale")} aria-hidden>
                    {b.emoji}
                  </span>
                  {b.earned ? <Pill tone="mint">Earned</Pill> : <Lock className="size-4 text-muted-foreground" aria-label="Locked" />}
                </div>
                <p className="font-heading text-lg font-semibold leading-tight">{b.name}</p>
                <p className="text-sm text-muted-foreground">{b.how}</p>
                {b.progress && !b.earned && (
                  <ProgressBar value={b.progress[0]} max={b.progress[1]} label={`${b.name} progress`} tone="sun" />
                )}
                {b.unlock && (
                  <p className="mt-auto rounded-xl bg-grape/15 px-2 py-1 text-xs font-bold">⚡ {b.unlock}</p>
                )}
              </Panel>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  );
}
