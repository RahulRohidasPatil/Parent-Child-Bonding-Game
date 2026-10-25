"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Page } from "@/components/qn/app-shell";
import { HeadsUpRound } from "@/components/qn/heads-up-round";
import { DiagramMatchBoard } from "@/components/qn/diagram-match-board";
import { Card, Notice, PageHeader, Spinner, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { gamesApi, type Match, type MatchResults } from "@/lib/games-api";
import { economyApi } from "@/lib/economy-api";
import { ApiError } from "@/lib/learn-api";

export function MatchScreen({ id }: { id: string }) {
  const [match, setMatch] = useState<Match | null>(null); const [results, setResults] = useState<MatchResults | null>(null);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [html, setHtml] = useState<string | null>(null); const [reward, setReward] = useState<number | null>(null);
  const [clock, setClock] = useState({ at: 0, skew: 0 }); const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const load = useCallback(async () => { try { const m = await gamesApi.match(id); setMatch(m); setClock({ at: Date.now(), skew: m.server_time_ms - Date.now() }); } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load the match."); } }, [id]);
  useEffect(() => { const first = setTimeout(load, 0); const poll = setInterval(load, 1500); const timer = setInterval(() => setTick(Date.now()), 250); return () => { clearTimeout(first); clearInterval(poll); clearInterval(timer); }; }, [load]);
  const phase = match?.phase;
  useEffect(() => { if (match?.game === "diagram") void gamesApi.diagram(id).then(setHtml).catch((e) => setError(e.message)); }, [id, match?.game]);
  useEffect(() => {
    if (phase !== "finished" || !match) return;
    void gamesApi.results(id).then(setResults).catch((e) => setError(e.message));
    const claim = match.mode === "parent_child" && match.game === "mcq"
      ? economyApi.claimMatchDuel(id).catch((e) => { if (e instanceof ApiError && e.status === 409) return economyApi.participation("match", id); throw e; })
      : economyApi.participation("match", id);
    void claim.then((r) => setReward(r.credited)).catch((e) => { if (e instanceof ApiError && e.status === 409) setReward(0); else setError(e.message); });
  }, [phase, id, match?.game, match?.mode]); // eslint-disable-line react-hooks/exhaustive-deps
  async function run(action: () => Promise<unknown>) { setBusy(true); setError(null); try { await action(); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); await load(); } finally { setBusy(false); } }
  if (!match) return <Page><PageHeader title="Match" /><Spinner /> {error && <Notice>{error}</Notice>}</Page>;
  const now = (tick || clock.at) + clock.skew;
  const left = (at?: number | null) => Math.max(0, Math.ceil(((at ?? now) - now) / 1000));
  const q = match.view.question; const turn = match.view.turn; const board = match.view.board;
  return <Page><PageHeader title={match.topic} sub={`${match.game === "mcq" ? "Quiz race" : match.game === "heads_up" ? "Heads-up" : "Diagram race"} · ${match.phase}`} right={<StatChips />} back={{ href: "/play", label: "Back to Play" }} />
    {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
    {phase === "waiting" && <Card className="flex flex-col gap-3 p-6"><p>Waiting for the creator to start.</p>{match.can_start && <Button variant="brand" disabled={busy} onClick={() => run(() => gamesApi.start(id))}>Start match</Button>}</Card>}
    {phase === "countdown" && <Card className="p-8 text-center text-4xl font-black">Starts in {left(match.play_at_ms)}</Card>}
    {q && <Card className="flex flex-col gap-4 p-5"><span className="font-bold">Question {q.index + 1} · {left(q.your_closes_at_ms)}s</span><h2 className="text-xl font-black">{q.question}</h2>{q.options.map((option, choice) => <Button key={choice} variant="soft" disabled={busy || q.answered || left(q.your_closes_at_ms) === 0} onClick={() => run(() => gamesApi.answer(id, q.index, choice))}>{option}</Button>)}{q.answered && <p className="font-bold">Answer saved. Waiting for the reveal…</p>}</Card>}
    {phase === "reveal" && match.view.reveals?.slice(-1).map((r) => <Card key={r.index} className="flex flex-col gap-2 p-5"><h2 className="font-black">{r.question}</h2><p className="text-brand-ink font-bold">{r.options[r.answer_index]}</p><p>{r.explanation}</p><span>Next question in {left(match.view.next_question_opens_at_ms)}s</span></Card>)}
    {turn && <HeadsUpRound key={`${match.id}-${turn.index}-${turn.you_are}`} turn={turn} remainingSeconds={left(turn.ends_at_ms)} busy={busy} onAction={(action, cardIndex) => { void run(() => gamesApi.card(id, cardIndex, action)); }} />}
    {phase === "handover" && <Card className="p-6 text-center font-black">Pass the phone. Next turn in {left(match.view.next_turn_starts_at_ms)}s.</Card>}
    {board && phase !== "waiting" && phase !== "countdown" && phase !== "finished" && <DiagramMatchBoard board={board} placements={match.view.you?.placements ?? {}} html={html} busy={busy} finished={match.view.you?.finished ?? false} remainingSeconds={left(match.view.your_deadline_ms)} wrongFinishes={match.view.you?.wrong_finishes ?? 0} feedback={feedback} onPlace={(placements) => { void run(() => gamesApi.place(id, placements)); }} onFinish={() => { void run(async () => { const r = await gamesApi.finish(id); setFeedback(r.perfect ? "Correct! Waiting for the other players." : `${r.correct} correct. Check ${r.wrong_slots?.join(", ") ?? "the missing labels"}.`); }); }} />}
    {results && <Card className="flex flex-col gap-3 p-5"><h2 className="text-xl font-black">Results</h2>{results.ranking.map((r) => <div key={r.id} className="flex gap-3 font-bold"><span>{r.rank ?? "–"}</span><span className="flex-1">{r.name} {r.winner ? "🏆" : ""}</span><span>{r.correct !== undefined ? `${r.correct}/${r.total}` : r.score !== undefined ? `${r.score} points` : r.total_ms != null ? `${(r.total_ms / 1000).toFixed(1)}s` : "Not completed"}</span></div>)}{reward !== null && <p>{reward ? `+${reward} coins added to your balance.` : "No new coins to collect for this round."}</p>}<Link href="/play/rooms" className="font-bold text-brand-ink">Play again</Link></Card>}
    {phase !== "finished" && match.view.scores && <Card className="flex flex-wrap gap-5 p-4">{match.view.scores.map((s) => <span key={s.name} className="font-bold">{s.name}: {s.correct ?? s.score ?? 0}</span>)}</Card>}
  </Page>;
}
