"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Face, Sprite } from "@/components/qn/sprite";
import { Card, PageHeader, Pill, Segmented, StatChips } from "@/components/qn/ui";
import { PARTY_GAMES } from "@/lib/qn-data";
import { useQN } from "@/lib/store";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "family", label: "Kid + parent", players: 2 },
  { value: "duo", label: "Duo vs duo", players: 4 },
  { value: "friends", label: "Friends", players: 6 },
  { value: "solo", label: "Solo", players: 1 },
] as const;
type Mode = (typeof MODES)[number]["value"];

export function PlayHub() {
  const [mode, setMode] = useState<Mode>("family");
  const [open, setOpen] = useState<string | null>(null);
  const look = useQN((s) => s.look);
  const players = MODES.find((m) => m.value === mode)!.players;

  return (
    <Page>
      <PageHeader title="Play" sub="Games built from what you’re learning" right={<StatChips className="hidden sm:flex" />} />
      <Segmented label="Who is playing" value={mode} onChange={setMode} options={MODES.map((m) => ({ value: m.value, label: m.label }))} size="lg" />

      <Link href="/play/duel" className="relative flex min-h-[160px] flex-col justify-center gap-2 overflow-hidden rounded-3xl bg-rose p-5 md:min-h-[200px] md:p-7">
        <span className="text-[13px] font-black tracking-[.04em] text-rose-ink">FAMILY DUEL · ONE PHONE</span>
        <span className="max-w-[200px] text-[22px] leading-tight font-black md:max-w-none md:text-[28px]">Quiz duel from your lesson</span>
        <span className="hidden max-w-[300px] text-[15px] font-bold text-rose-ink md:block lg:max-w-[420px]">Same questions for both players. Answer in secret, pass the phone, then see who knew more and why.</span>
        <span className="mt-1 flex h-10 items-center self-start rounded-xl bg-rose-strong px-4 text-[15px] font-black text-white">Start a duel</span>
        <Sprite id={look} className="absolute right-[70px] -bottom-3 w-[140px] md:right-[150px] md:w-[200px]" />
        <Sprite id="mom" flip className="absolute -right-2 -bottom-3 w-[140px] md:right-0 md:w-[200px]" />
      </Link>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href={`/play/rooms?game=mcq&mode=${mode === "family" ? "parent_child" : mode}`} className="rounded-2xl bg-brand-soft p-5 font-black text-brand-ink">Quiz race · solo or together</Link>
        <Link href={`/play/rooms?game=heads_up&mode=${mode === "solo" ? "friends" : mode === "family" ? "parent_child" : mode}`} className="rounded-2xl bg-rose p-5 font-black text-rose-ink">Forbidden clues · heads-up</Link>
        <Link href={`/play/rooms?game=diagram&mode=${mode === "duo" ? "friends" : mode === "family" ? "parent_child" : mode}`} className="rounded-2xl bg-coin p-5 font-black text-coin-ink">Diagram race</Link>
      </div>
      <Link href="/play/rebuild" className="font-bold text-brand-ink">Rebuild a saved lesson diagram together</Link>
      <Link href="/play/weekly" className="font-bold text-brand-ink">See the weekly challenge preview</Link>
      <section className="flex flex-col gap-3" aria-labelledby="party-h">
        <div className="flex items-center justify-between gap-3">
          <h2 id="party-h" className="text-[17px] font-black">Party games</h2>
          <Pill className="bg-warn text-warn-ink">Coming soon</Pill>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PARTY_GAMES.filter((g) => !["factcheck", "forbidden", "forehead"].includes(g.id)).map((g) => {
            const soloOnly = g.id === "race";
            const ok = soloOnly ? mode === "solo" : players >= g.min;
            const isOpen = open === g.id;
            return (
              <li key={g.id}>
                <Card className={cn("flex flex-col gap-2 p-3.5", !ok && "opacity-60")}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : g.id)} disabled={!ok} aria-expanded={isOpen} aria-disabled={!ok} className="flex items-center gap-3 text-left disabled:cursor-not-allowed">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-black" style={{ background: g.tile, color: g.ink }} aria-hidden="true">{g.glyph}</span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[16px] font-black">{g.name}</span>
                      <span className={cn("text-[13px] font-bold", ok ? "text-muted-foreground" : "text-rose-ink")}>{ok ? `${g.players} players` : soloOnly ? "Solo mode only" : `Needs ${g.min}+ players`}</span>
                    </span>
                    <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-2 pl-14">
                      <p className="text-sm leading-snug font-bold text-muted-foreground">{g.how}</p>
                      {soloOnly && <Link href="/learn" className="self-start rounded-xl bg-brand px-3 py-2 text-sm font-black text-white">Make flashcards</Link>}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
        <p className="text-[13px] font-bold text-muted-foreground">Quiz, heads-up and diagram games are available above. The other party activities are coming later.</p>
      </section>

      <Card className="flex items-center gap-3 p-4">
        <span className="flex" aria-hidden="true"><Face id="zara" size={40} tint="#e6f0fc" ring="#fff" /><Face id="leo" size={40} tint="#fff6dc" ring="#fff" className="-ml-2.5" /><Face id="mia" size={40} tint="#fde9f0" ring="#fff" className="-ml-2.5" /></span>
        <span className="flex flex-1 flex-col leading-tight">
          <span className="text-[15px] font-extrabold">Challenge a friend</span>
          <span className="text-[13px] font-bold text-muted-foreground">Same quiz, each on your own phone</span>
        </span>
        <Link href="/friends" className="text-sm font-black text-brand-ink">Friends</Link>
      </Card>
    </Page>
  );
}
