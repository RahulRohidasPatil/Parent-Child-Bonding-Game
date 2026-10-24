"use client";

import Link from "next/link";
import { ArrowRight, Flame, MessageCircleHeart, Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Allowance } from "@/components/kay/allowance";
import { Avatar, Eyebrow, Page, Panel, Pill, ProgressBar, Ring, SectionHead } from "@/components/kay/ui";
import { BLOCKS, WEEK } from "@/lib/kay/content";
import { PARTNER_ACTIVITY, PROGRESS, QUESTS, TODAY } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

const blockDone = (p: { lesson: boolean; flashcards: number; quiz: number | null }) =>
  p.lesson && p.flashcards === 100 && p.quiz !== null;

const weekPct = (who: "me" | "partner") =>
  Math.round(
    (BLOCKS.reduce((n, b) => {
      const p = PROGRESS[b.id][who];
      return n + (p.lesson ? 1 : 0) + p.flashcards / 100 + (p.quiz !== null ? 1 : 0);
    }, 0) /
      (BLOCKS.length * 3)) *
      100,
  );

export default function Home() {
  const { me, partner, teamName, dailyGoal } = useSession();
  const next = BLOCKS.find((b) => !blockDone(PROGRESS[b.id].me)) ?? BLOCKS[0];
  const blocksDone = BLOCKS.filter((b) => blockDone(PROGRESS[b.id].me)).length;

  return (
    <Page>
      <header className="flex items-center gap-3 pt-2">
        <Avatar person={me} size={52} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-muted-foreground">Thursday</p>
          <h1 className="truncate font-heading text-2xl font-semibold">Hi {me.name}! 👋</h1>
        </div>
        <Pill tone="coral" className="py-1 text-sm" aria-label={`${TODAY.streakDays} day streak`}>
          <Flame className="size-4" aria-hidden /> {TODAY.streakDays}
        </Pill>
      </header>

      {/* This week's topic */}
      <section
        aria-labelledby="week-title"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-grape to-sky p-5 text-ink"
      >
        <span className="pointer-events-none absolute -top-6 -right-4 text-[8rem] leading-none opacity-30" aria-hidden>
          {WEEK.emoji}
        </span>
        <Eyebrow className="text-ink/70">
          Week {WEEK.number} · {WEEK.subject}
        </Eyebrow>
        <h2 id="week-title" className="mt-1 font-heading text-3xl font-bold">
          {WEEK.title}
        </h2>
        <p className="mt-1 max-w-[16rem] text-sm font-semibold text-ink/80">{WEEK.blurb}</p>
        <div className="mt-4 flex items-center gap-2" aria-label={`${blocksDone} of ${BLOCKS.length} blocks done`}>
          {BLOCKS.map((b) => (
            <span
              key={b.id}
              className={cn(
                "grid size-9 place-items-center rounded-xl text-lg",
                blockDone(PROGRESS[b.id].me) ? "bg-white/90" : "bg-white/35",
              )}
              aria-hidden
            >
              {b.emoji}
            </span>
          ))}
        </div>
        <Link
          href={`/learn/${next.id}`}
          className={cn(buttonVariants({ variant: "glass", size: "game" }), "mt-4 h-auto min-h-14 w-full border-transparent bg-white py-3 text-center whitespace-normal text-ink hover:bg-white/90")}
        >
          Continue: {next.title} <ArrowRight />
        </Link>
      </section>

      {/* Today */}
      <Panel className="flex items-center gap-4">
        <Ring value={TODAY.minutesDone} max={dailyGoal} label={`${TODAY.minutesDone} of ${dailyGoal} minutes today`}>
          <span className="block font-heading text-2xl font-bold leading-none">{TODAY.minutesDone}</span>
          <span className="text-xs font-bold text-muted-foreground">/{dailyGoal} min</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <Allowance compact />
          <p className="mt-2 text-sm text-muted-foreground">
            {dailyGoal - TODAY.minutesDone > 0
              ? `${dailyGoal - TODAY.minutesDone} more minutes to hit today's goal.`
              : "Goal smashed today! 🎉"}
          </p>
        </div>
      </Panel>

      {/* Team */}
      {partner ? (
        <Panel>
          <SectionHead title={teamName} href="/me/progress" linkLabel="Compare" />
          <ul className="mt-3 flex flex-col gap-3">
            {(
              [
                [me, "me"],
                [partner, "partner"],
              ] as const
            ).map(([p, who]) => (
              <li key={who} className="flex items-center gap-3">
                <Avatar person={p} size={40} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{who === "me" ? "You" : p.name}</span>
                    <span className="text-muted-foreground">{weekPct(who)}% of the week</span>
                  </div>
                  <ProgressBar value={weekPct(who)} label={`${p.name} week progress`} tone={p.color} className="mt-1" />
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-col gap-2 border-t pt-3 text-sm">
            {PARTNER_ACTIVITY.slice(0, 2).map((a, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>
                  <strong>{a.who === "me" ? "You" : partner.name}</strong> {a.text}
                </span>
                <span className="shrink-0 text-muted-foreground">{a.when}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>🤝</span>
          <p className="flex-1 text-sm">Learning solo. Team up with a parent, kid or friend any time.</p>
          <Link href="/me" className={cn(buttonVariants({ variant: "glass" }), "rounded-full")}>
            Team up
          </Link>
        </Panel>
      )}

      {/* Parent helper */}
      {me.role === "parent" && partner && (
        <Link href="/explain" className="group">
          <Panel className="flex items-center gap-3 border-grape/40 bg-grape/10 transition group-hover:bg-grape/15">
            <MessageCircleHeart className="size-8 shrink-0 text-grape" aria-hidden />
            <div className="flex-1">
              <p className="font-heading text-lg font-semibold">Explain it to {partner.name}</p>
              <p className="text-sm text-muted-foreground">Kid-friendly ways to talk about this week&apos;s ideas.</p>
            </div>
            <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
          </Panel>
        </Link>
      )}

      {/* Competition */}
      <Link href="/compete" className="group">
        <Panel className="flex items-center gap-4 bg-sun/15 transition group-hover:bg-sun/25">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sun text-ink">
            <Trophy className="size-7" aria-hidden />
          </span>
          <div className="flex-1">
            <Eyebrow>Weekly Showdown</Eyebrow>
            <p className="font-heading text-xl font-semibold">{WEEK.competitionAt}</p>
            <p className="text-sm text-muted-foreground">6 teams from your class have signed up</p>
          </div>
          <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
        </Panel>
      </Link>

      {/* Quests */}
      <section className="flex flex-col gap-3">
        <SectionHead title="Today's quests" href="/rewards" />
        {QUESTS.filter((q) => q.kind === "daily").map((q) => {
          const done = q.progress[0] >= q.progress[1];
          return (
            <Panel key={q.id} className="flex items-center gap-3 p-3.5">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-lg", done ? "bg-mint" : "bg-muted")} aria-hidden>
                {done ? "✅" : "🎯"}
              </span>
              <div className="flex-1">
                <p className="font-bold leading-tight">{q.title}</p>
                <ProgressBar value={q.progress[0]} max={q.progress[1]} label={q.title} tone="mint" className="mt-1.5" />
              </div>
              <Pill tone={done ? "mint" : "muted"}>{done ? "Claim" : q.reward}</Pill>
            </Panel>
          );
        })}
      </section>
    </Page>
  );
}
