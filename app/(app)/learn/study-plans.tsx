"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, ChevronRight, X } from "lucide-react";
import { Card } from "@/components/qn/ui";
import { forgetPlan, useQN } from "@/lib/store";
import type { StudyPlan, Subtopic } from "@/lib/study-plan";
import { cn } from "@/lib/utils";

/** The "Study Plan" section of the Learn tab: each main topic expands into its subtopics. */
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const hashPlan = () => window.location.hash.match(/^#plan-(.+)$/)?.[1] ?? null;

export function StudyPlans() {
  const plans = useQN((s) => s.plans);
  // A new plan arrives as /learn#plan-<id> and starts open; a tap overrides that.
  const linked = useSyncExternalStore(subscribeHash, hashPlan, () => null);
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  const open = choice === undefined ? linked : choice;

  // Cache Components keeps this page alive while hidden: forget the last tap so the next new plan opens.
  useLayoutEffect(() => () => setChoice(undefined), []);

  useEffect(() => {
    if (linked) requestAnimationFrame(() => document.getElementById(`plan-${linked}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }, [linked]);

  if (plans.length === 0) return null;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="plans-h">
      <h2 id="plans-h" className="text-[17px] font-black">Study Plan</h2>
      <ul className="flex flex-col gap-3">
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} open={open === p.id} onToggle={() => setChoice(open === p.id ? null : p.id)} />
        ))}
      </ul>
    </section>
  );
}

function PlanCard({ plan, open, onToggle }: { plan: StudyPlan; open: boolean; onToggle: () => void }) {
  const panel = `plan-${plan.id}-panel`;
  return (
    <li id={`plan-${plan.id}`} className="scroll-mt-6">
      <Card className="flex flex-col gap-0 p-0">
        <div className="flex items-center gap-3 p-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-sky-ink">
            <CalendarDays className="size-6" strokeWidth={2.2} />
          </span>
          <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panel} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-xs font-black tracking-[.04em] text-muted-foreground uppercase">
                Main topic · {plan.subtopics.length} subtopic{plan.subtopics.length === 1 ? "" : "s"}
              </span>
              <span className="truncate text-[16px] font-black">{plan.title}</span>
              {plan.source && <span className="truncate text-[13px] font-bold text-muted-foreground">{plan.source}</span>}
            </span>
            <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => forgetPlan(plan.id)}
            aria-label={`Remove ${plan.title}`}
            className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>
        {open && (
          <div id={panel} className="flex flex-col gap-2.5 border-t border-line p-3.5">
            {plan.overview && <p className="text-[15px] leading-relaxed font-semibold">{plan.overview}</p>}
            <ol className="flex flex-col gap-2">
              {plan.subtopics.map((s, i) => (
                <SubtopicItem key={`${plan.id}-${i}`} planId={plan.id} index={i} sub={s} />
              ))}
            </ol>
          </div>
        )}
      </Card>
    </li>
  );
}

/** Opens the subtopic as a full lesson (made the first time, then reused). */
function SubtopicItem({ planId, index, sub }: { planId: string; index: number; sub: Subtopic }) {
  return (
    <li>
      <Link
        href={`/learn/plan/${planId}/${index}`}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-background px-3 py-2.5 text-left hover:bg-muted"
      >
        <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-night px-1.5 text-sm font-black text-white">{index + 1}</span>
        <span className="min-w-0 flex-1 text-[15px] font-extrabold">{sub.title}</span>
        <span className="shrink-0 text-xs font-black text-brand">{sub.lessonId ? "Open lesson" : "Start lesson"}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}
