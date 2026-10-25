"use client";
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Card, Coin, Notice, PageHeader, ProgressBar, Segmented, StatChips, Spinner } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { economyApi, type Quest } from "@/lib/economy-api";

export function QuestsScreen() {
  const [tab, setTab] = useState<"daily" | "weekly">("daily");
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setQuests((await economyApi.quests()).items); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load quests."); }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => { void load(); }, 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    window.addEventListener("focus", load);
    return () => { clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", load); };
  }, [load]);
  async function claim(q: Quest) {
    setBusy(q.id);
    try { await economyApi.claim(q); await load(); }
    catch (e) { await load(); setError(e instanceof Error ? e.message : "Couldn’t claim the reward."); }
    finally { setBusy(null); }
  }
  return <Page>
    <PageHeader title="Quests" sub="Your learning, saved across devices" right={<StatChips />} />
    {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
    <Segmented label="Quest list" value={tab} onChange={setTab} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]} />
    {!quests && <div role="status" className="flex items-center gap-2 p-6"><Spinner /> Loading quests…</div>}
    <ul className="flex flex-col gap-3">{quests?.filter((q) => q.kind === tab).map((q) => <li key={q.id}>
      <Card className="flex items-center gap-3 p-4">
        <div className="flex flex-1 flex-col gap-2"><span className="font-extrabold">{q.title}</span>
          <div className="flex items-center gap-2"><ProgressBar value={q.progress / q.target * 100} className="flex-1" /><span className="text-sm font-bold">{q.progress}/{q.target}</span></div>
          <span className="text-xs text-muted-foreground">Resets {new Date(q.resets_at).toLocaleString()}</span>
        </div>
        {q.claimed ? <span className="flex items-center gap-1 font-bold text-brand-ink"><Check /> Claimed</span> : <Button variant={q.claimable ? "brand" : "soft"} size="pill" disabled={!q.claimable || busy !== null} onClick={() => claim(q)}><Coin size={16} /> +{q.reward}</Button>}
      </Card>
    </li>)}</ul>
    <p className="text-sm font-bold text-muted-foreground">Daily quests reset at midnight and weekly quests on Monday, in Europe/Berlin.</p>
  </Page>;
}
