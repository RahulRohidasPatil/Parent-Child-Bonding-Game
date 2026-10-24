"use client";

import Link from "next/link";
import { Bot, CalendarClock, Swords, Users, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, Eyebrow, Page, Panel, Pill, ProgressBar, SectionHead } from "@/components/kay/ui";
import { WEEK } from "@/lib/kay/content";
import { OPPONENTS, PAST_RESULTS, TODAY } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

const FORMAT = [
  { emoji: "❓", title: "Team quiz", body: "Answer together, one phone each" },
  { emoji: "🛠️", title: "Practical challenge", body: "Build, act or explain it" },
  { emoji: "⚡", title: "Lightning round", body: "Fastest correct team wins" },
];

const MODES = [
  { href: "/compete/match", icon: Bot, title: "Practice vs Kay", body: "Warm up against a friendly bot" },
  { href: "/compete/match", icon: Users, title: "Team vs team", body: "2v2 with another parent–kid team" },
  { href: "/compete/match", icon: UserRound, title: "Me vs my partner", body: "Kid against grown-up. Who knows more?" },
  { href: "/compete/match", icon: Swords, title: "Play friends", body: "Invite with a code, no parent needed" },
];

export default function Compete() {
  const { me, partner, teamName } = useSession();
  const myTeam = { name: teamName ?? me.name, points: TODAY.points, members: partner ? [me, partner] : [me] };
  const board = [...OPPONENTS.map((t) => ({ ...t, mine: false })), { ...myTeam, mine: true }].sort((a, b) => b.points - a.points);

  return (
    <Page title="Compete">
      {/* Weekly showdown */}
      <section aria-labelledby="showdown" className="overflow-hidden rounded-3xl bg-ink text-white">
        <div className="relative p-5">
          <Eyebrow className="text-sun">Weekly Showdown · {WEEK.title}</Eyebrow>
          <h2 id="showdown" className="mt-1 flex items-center gap-2 font-heading text-3xl font-bold">
            <CalendarClock className="size-7 text-sun" aria-hidden /> {WEEK.competitionAt}
          </h2>
          <p className="mt-1 text-sm text-white/75">6 teams from Class 4B · about 20 minutes</p>

          <ol className="mt-4 grid grid-cols-3 gap-2">
            {FORMAT.map((f, i) => (
              <li key={f.title} className="rounded-2xl bg-white/10 p-2.5">
                <span className="text-2xl" aria-hidden>
                  {f.emoji}
                </span>
                <p className="mt-1 text-sm font-bold leading-tight">
                  {i + 1}. {f.title}
                </p>
                <p className="text-xs text-white/70">{f.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-white/60">Format is a draft and may change.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/8 p-4">
          <div className="flex -space-x-2" aria-hidden>
            {myTeam.members.map((m) => (
              <Avatar key={m.name} person={m} size={40} />
            ))}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{teamName ? `${teamName} is signed up` : "Join as a solo player"}</p>
            <ProgressBar value={58} label="Team readiness" tone="sun" className="mt-1 bg-white/15" />
            <p className="mt-1 text-xs text-white/70">58% ready · finish Moons &amp; Gravity to be fully prepared</p>
          </div>
        </div>
      </section>

      <Link href="/compete/match" className={cn(buttonVariants({ variant: "sun", size: "game" }), "w-full")}>
        <Swords /> Play a practice match
      </Link>

      {/* Modes */}
      <section className="flex flex-col gap-3">
        <SectionHead title="Ways to play" />
        <ul className="grid grid-cols-2 gap-3">
          {MODES.map(({ href, icon: Icon, title, body }) => (
            <li key={title}>
              <Link href={href} className="group block h-full">
                <Panel className="h-full p-3.5 transition group-hover:bg-accent">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <p className="mt-2 font-heading text-lg font-semibold leading-tight">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </Panel>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Class leaderboard */}
      <section className="flex flex-col gap-3">
        <SectionHead title="Class 4B teams" />
        <Panel className="p-2">
          <ol>
            {board.map((t, i) => (
              <li
                key={t.name}
                className={cn("flex items-center gap-3 rounded-2xl p-2", t.mine && "bg-sun/20")}
                aria-current={t.mine ? "true" : undefined}
              >
                <span className="w-6 text-center font-heading text-lg font-bold">{i + 1}</span>
                <div className="flex -space-x-2" aria-hidden>
                  {t.members.map((m) => (
                    <Avatar key={m.name} person={m} size={34} />
                  ))}
                </div>
                <span className="flex-1 font-bold">
                  {t.name} {t.mine && <span className="text-sm text-muted-foreground">(you)</span>}
                </span>
                <span className="font-heading font-semibold tabular-nums">{t.points}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHead title="Past weeks" />
        {PAST_RESULTS.map((r) => (
          <Panel key={r.week} className="flex items-center gap-3 p-3.5">
            <span className="text-2xl" aria-hidden>
              {r.place === 1 ? "🥇" : r.place === 2 ? "🥈" : "🥉"}
            </span>
            <div className="flex-1">
              <p className="font-bold">{r.week}</p>
              <p className="text-sm text-muted-foreground">
                Place {r.place} of {r.of}
              </p>
            </div>
            <Pill tone="sun">+{r.points} pts</Pill>
          </Panel>
        ))}
      </section>
    </Page>
  );
}
