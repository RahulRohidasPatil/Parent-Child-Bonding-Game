"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Avatar, Eyebrow, Page, Panel, SectionHead } from "@/components/kay/ui";
import { MASTERY, WEEK_MINUTES } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

const level = (n: number) =>
  n >= 75 ? { label: "Strong", tone: "text-success" } : n >= 40 ? { label: "Getting there", tone: "text-foreground" } : { label: "Practise next", tone: "text-destructive" };

export default function Progress() {
  const { me, partner } = useSession();
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(...WEEK_MINUTES.flatMap((d) => [d.me, partner ? d.partner : 0]));
  const practise = MASTERY.filter((m) => m.me < 40);
  // Learn-together moments: where one teammate is strong and the other isn't.
  const swaps = partner ? MASTERY.filter((m) => Math.abs(m.me - m.partner) >= 25) : [];

  return (
    <Page back="/me" title="My progress">
      {/* Minutes chart */}
      <Panel className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold">Minutes learned this week</h2>
            <p className="text-sm text-muted-foreground">Goal: 15 a day</p>
          </div>
          <button
            type="button"
            onClick={() => setAsTable(!asTable)}
            aria-pressed={asTable}
            className="shrink-0 rounded-full border px-3 py-1 text-xs font-bold hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {asTable ? "Show chart" : "Show as table"}
          </button>
        </div>

        {partner && (
          <ul className="flex gap-4 text-sm font-bold" aria-label="Legend">
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-sky" aria-hidden /> You
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-coral" aria-hidden /> {partner.name}
            </li>
          </ul>
        )}

        {asTable ? (
          <table className="w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 font-bold">Day</th>
                <th className="py-1 text-right font-bold">You</th>
                {partner && <th className="py-1 text-right font-bold">{partner.name}</th>}
              </tr>
            </thead>
            <tbody>
              {WEEK_MINUTES.map((d) => (
                <tr key={d.day} className="border-t">
                  <td className="py-1.5">{d.day}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.me} min</td>
                  {partner && <td className="py-1.5 text-right tabular-nums">{d.partner} min</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="relative" role="img" aria-label={`Minutes per day. ${WEEK_MINUTES.map((d) => `${d.day}: you ${d.me}${partner ? `, ${partner.name} ${d.partner}` : ""}`).join("; ")}.`}>
            {/* 15-minute goal line */}
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50" style={{ bottom: `calc(${(15 / max) * 128}px + 1.5rem)` }} aria-hidden>
              <span className="absolute -top-4 right-0 text-[10px] font-bold text-muted-foreground">goal</span>
            </div>
            <ul className="grid grid-cols-4 gap-3" aria-hidden>
              {WEEK_MINUTES.map((d) => (
                <li key={d.day} className="flex flex-col items-center gap-1">
                  <div className="flex h-36 items-end gap-[2px]">
                    {[
                      { v: d.me, c: "bg-sky", who: "You" },
                      ...(partner ? [{ v: d.partner, c: "bg-coral", who: partner.name }] : []),
                    ].map((b) => (
                      <div key={b.who} className="group relative flex w-5 flex-col items-center justify-end" title={`${b.who}, ${d.day}: ${b.v} min`}>
                        <span className="text-[10px] font-bold tabular-nums text-muted-foreground">{b.v}</span>
                        <div className={cn("w-full rounded-t-[4px]", b.c)} style={{ height: `${(b.v / max) * 128}px` }} />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{d.day}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* Mastery */}
      <section className="flex flex-col gap-3">
        <SectionHead title="What you understand" />
        <Panel className="flex flex-col gap-3.5">
          {MASTERY.map((m) => {
            const lv = level(m.me);
            return (
              <div key={m.concept}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold">{m.concept}</span>
                  <span className={cn("shrink-0 text-xs font-extrabold", lv.tone)}>
                    {lv.label} · {m.me}%
                  </span>
                </div>
                <div
                  className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`${m.concept} understanding`}
                  aria-valuenow={m.me}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${m.me}%` }} />
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground">Based on your quiz and flashcard answers this week.</p>
        </Panel>
      </section>

      {practise.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHead title="Practise next" />
          {practise.map((m) => (
            <Link key={m.concept} href={`/learn/${m.blockId}`} className="group">
              <Panel className="flex items-center gap-3 p-3.5 transition group-hover:bg-accent">
                <span className="text-2xl" aria-hidden>
                  🎯
                </span>
                <span className="flex-1 font-bold">{m.concept}</span>
                <ArrowRight className="size-5 text-muted-foreground" aria-hidden />
              </Panel>
            </Link>
          ))}
        </section>
      )}

      {partner && swaps.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHead title="Learn from each other" />
          {swaps.map((m) => {
            const iLead = m.me > m.partner;
            const teacher = iLead ? me : partner;
            const learner = iLead ? partner : me;
            return (
              <Panel key={m.concept} className="flex items-center gap-3 bg-grape/10 p-3.5">
                <Avatar person={teacher} size={44} />
                <div className="flex-1 text-sm">
                  <Eyebrow>{m.concept}</Eyebrow>
                  <p>
                    <strong>{iLead ? "You're" : `${teacher.name} is`}</strong> strong here. {iLead ? `Teach ${learner.name}` : `Ask ${teacher.name} to explain it`}!
                  </p>
                </div>
                <Lightbulb className="size-5 shrink-0 text-grape" aria-hidden />
              </Panel>
            );
          })}
        </section>
      )}
    </Page>
  );
}
