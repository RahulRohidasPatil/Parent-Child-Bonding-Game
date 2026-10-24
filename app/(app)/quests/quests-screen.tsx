"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Card, Coin, Flame, PageHeader, ProgressBar, Segmented, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { QUESTS } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";

export function QuestsScreen() {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const progress = useQN((s) => s.progress);
  const claimed = useQN((s) => s.claimed);
  const streak = useQN((s) => s.streakDays);

  function claim(id: string, reward: number) {
    setState((s) => (s.claimed.includes(id) ? {} : { claimed: [...s.claimed, id], coins: s.coins + reward }));
  }

  const list = QUESTS.filter((q) => q.kind === tab);
  return (
    <Page>
      <PageHeader title="Quests" sub={tab === "daily" ? "Daily quests" : "Weekly quests"} right={<StatChips className="hidden sm:flex" />} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <Card className="flex items-center gap-4 border-0 bg-flame p-5">
          <Flame size={48} />
          <span className="flex flex-col leading-tight">
            <span className="text-[32px] font-black text-flame-ink">
              {streak} {streak === 1 ? "day" : "days"}
            </span>
            <span className="text-sm font-extrabold text-[#7a4a2a]">{streak ? "Learn something today to keep it going" : "Finish a quiz or some flashcards to start a streak"}</span>
          </span>
        </Card>
        <div className="flex flex-col gap-3">
          <Segmented label="Quest list" value={tab} onChange={setTab} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]} />
          <ul className="flex flex-col gap-2.5">
            {list.map((q) => {
              const n = Math.min(progress[q.id] ?? 0, q.of);
              const done = n >= q.of;
              const got = claimed.includes(q.id);
              return (
                <li key={q.id}>
                  <Card className="flex items-center gap-3 p-3.5">
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="text-[15px] font-black">{q.title}</span>
                      <span className="flex items-center gap-2">
                        <ProgressBar value={(n / q.of) * 100} className="h-2 flex-1" />
                        <span className="text-xs font-black text-muted-foreground">
                          {n}/{q.of}
                        </span>
                      </span>
                    </span>
                    {got ? (
                      <span className="flex h-10 items-center gap-1 px-2 text-sm font-black text-brand">
                        <Check className="size-4" strokeWidth={3} /> Done
                      </span>
                    ) : done ? (
                      <Button variant="brand" size="pill" onClick={() => claim(q.id, q.reward)} className="h-10">
                        <Coin size={16} /> +{q.reward}
                      </Button>
                    ) : (
                      <span className="flex h-10 items-center gap-1.5 rounded-xl bg-coin px-3 text-sm font-black text-coin-ink">
                        <Coin size={16} /> +{q.reward}
                      </span>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
          <p className="text-[13px] font-bold text-muted-foreground">Lessons and flashcards are always free. Quest progress is saved in this browser for now.</p>
        </div>
      </div>
    </Page>
  );
}
