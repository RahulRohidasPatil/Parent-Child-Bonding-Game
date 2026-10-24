"use client";

import Link from "next/link";
import { Check, ChevronRight, Layers, ListChecks, PlayCircle } from "lucide-react";
import { Allowance } from "@/components/kay/allowance";
import { Avatar, Eyebrow, Page, Panel, Pill } from "@/components/kay/ui";
import { BLOCKS, WEEK } from "@/lib/kay/content";
import { PROGRESS } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

export default function Learn() {
  const { partner } = useSession();
  return (
    <Page title="Learn">
      <div className="flex items-center gap-3">
        <span className="grid size-14 place-items-center rounded-2xl bg-grape/20 text-3xl" aria-hidden>
          {WEEK.emoji}
        </span>
        <div>
          <Eyebrow>This week · {WEEK.subject}</Eyebrow>
          <h2 className="font-heading text-2xl font-semibold leading-tight">{WEEK.title}</h2>
        </div>
      </div>

      <Panel>
        <Allowance />
      </Panel>

      <ol className="flex flex-col gap-3" aria-label="Learning blocks">
        {BLOCKS.map((b, i) => {
          const mine = PROGRESS[b.id].me;
          const theirs = PROGRESS[b.id].partner;
          const steps = [
            { label: "Lesson", icon: PlayCircle, done: mine.lesson, href: `/learn/${b.id}` },
            { label: "Flashcards", icon: Layers, done: mine.flashcards === 100, href: `/learn/${b.id}/flashcards` },
            { label: "Quiz", icon: ListChecks, done: mine.quiz !== null, href: `/learn/${b.id}/quiz` },
          ];
          const allDone = steps.every((s) => s.done);
          return (
            <li key={b.id}>
              <Panel className={cn("flex flex-col gap-3", allDone && "bg-mint/10")}>
                <Link href={`/learn/${b.id}`} className="group flex items-center gap-3 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-2xl" aria-hidden>
                    {b.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-muted-foreground">
                      Block {i + 1} · {b.minutes} min
                    </p>
                    <p className="font-heading text-xl font-semibold leading-tight group-hover:underline">{b.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{b.summary}</p>
                  </div>
                  {allDone ? <Pill tone="mint">Done</Pill> : <ChevronRight className="size-5 text-muted-foreground" aria-hidden />}
                </Link>
                <ul className="grid grid-cols-3 gap-2">
                  {steps.map(({ label, icon: Icon, done, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className={cn(
                          "flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-bold transition hover:bg-accent",
                          done && "border-transparent bg-mint/25",
                        )}
                      >
                        {done ? <Check className="size-4 text-success" aria-hidden /> : <Icon className="size-4" aria-hidden />}
                        {label}
                        <span className="sr-only">{done ? "(done)" : "(not done yet)"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {partner && (
                  <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Avatar person={partner} size={22} />
                    {partner.name}:{" "}
                    {[theirs.lesson && "lesson", theirs.flashcards === 100 && "flashcards", theirs.quiz !== null && `quiz ${theirs.quiz}%`]
                      .filter(Boolean)
                      .join(" · ") || "not started"}
                  </p>
                )}
              </Panel>
            </li>
          );
        })}
      </ol>
    </Page>
  );
}
