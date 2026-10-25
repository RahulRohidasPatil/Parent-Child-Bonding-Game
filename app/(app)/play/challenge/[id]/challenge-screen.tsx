"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Hourglass, Swords, Timer, Trophy } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { DuelQuestion, DuelReview, tintOf } from "@/components/qn/duel";
import { Face, Sprite, Stage } from "@/components/qn/sprite";
import { Card, Coin, Notice, PageHeader, ProgressBar, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { type Duel, SocialError, msUntil, socialApi } from "@/lib/social-api";
import { addCoins, bump, markStudiedToday } from "@/lib/store";
import { cn } from "@/lib/utils";

const POLL_MS = 2_000;
const coinsFor = (score: number) => score * 10 + 20;
const back = { href: "/friends", label: "Back to Friends" };

function rewardOnce(duel: Duel) {
  const key = `qn.duel.rewarded.${duel.id}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    /* storage blocked: reward anyway */
  }
  addCoins(coinsFor(duel.results!.me.score));
  bump(["d-duel", "w-duels"]);
  markStudiedToday();
}

/** A live duel with a friend: invite, countdown, timed questions on both phones, then results. */
export function ChallengeScreen({ id }: { id: string }) {
  const [state, setState] = useState<{ duel: Duel; at: number } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const rewarded = useRef(false);

  const load = useCallback(async () => {
    try {
      setState({ duel: await socialApi.duel(id), at: Date.now() });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof SocialError ? e.message : "Couldn’t load the duel.");
    }
  }, [id]);

  const status = state?.duel.status;
  const live = !state || status === "invited" || status === "active";
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of server data
    load();
    if (!live) return;
    const poll = setInterval(load, POLL_MS);
    const clock = setInterval(() => setTick((n) => n + 1), 250); // countdowns
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load, live]);

  useEffect(() => {
    if (state?.duel.status === "finished" && state.duel.results && !rewarded.current) {
      rewarded.current = true;
      rewardOnce(state.duel);
    }
  }, [state]);

  async function act(run: () => Promise<Duel>, fallback: string) {
    setBusy(true);
    setError(null);
    try {
      setState({ duel: await run(), at: Date.now() });
    } catch (e) {
      setError(e instanceof SocialError ? e.message : fallback);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function answer(index: number, choice: number) {
    if (!state || sending !== null) return;
    setSending(index);
    setError(null);
    try {
      const { answered } = await socialApi.answer(id, index, choice);
      setState((s) => (s ? { ...s, duel: { ...s.duel, progress: { ...s.duel.progress, me: answered } } } : s));
    } catch (e) {
      setError(e instanceof SocialError ? e.message : "Couldn’t send that answer. Tap it again.");
      await load();
    } finally {
      setSending(null);
    }
  }

  if (!state)
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Live duel" back={back} />
        {loadError ? <Notice>{loadError}</Notice> : <Working title="Loading the duel…" />}
      </Page>
    );

  const { duel, at } = state;
  const me = duel.my_role === "challenger" ? duel.challenger : duel.opponent;
  const them = duel.my_role === "challenger" ? duel.opponent : duel.challenger;
  const secs = (t: string | null) => Math.max(0, Math.ceil(msUntil(t, duel, at) / 1000));
  const header = <PageHeader title="Live duel" sub={`${duel.num_questions} questions on ${duel.lesson_title}`} back={back} />;
  const versus = (
    <Stage className="h-[240px] md:h-[280px]">
      <div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
      <Sprite id={me.avatar} className="absolute bottom-4 left-1/2 w-[170px] -translate-x-[88%] md:w-[200px]" alt={me.display_name} />
      <Sprite id={them.avatar} flip className="absolute bottom-4 left-1/2 w-[170px] -translate-x-[12%] md:w-[200px]" alt={them.display_name} />
    </Stage>
  );

  // ---------- invite ----------
  if (duel.status === "invited") {
    const left = secs(duel.invite_expires_at);
    return (
      <Page className="max-w-[720px]">
        {header}
        {versus}
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <Hourglass className="size-7 text-brand motion-safe:animate-pulse" />
          <span className="text-[22px] font-black">{duel.my_role === "challenger" ? `Waiting for ${them.display_name} to accept…` : `${them.display_name} challenges you!`}</span>
          <span className="text-[15px] font-bold text-muted-foreground">{left}s left to answer the invite</span>
        </Card>
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
        {duel.my_role === "challenger" ? (
          <Button variant="soft" size="cta" disabled={busy} onClick={() => act(() => socialApi.cancelDuel(id), "Couldn’t call off the duel.")}>
            Call it off
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="soft" size="cta" disabled={busy} onClick={() => act(() => socialApi.declineDuel(id), "Couldn’t answer the invite.")}>
              Not now
            </Button>
            <Button variant="brand" size="cta" disabled={busy} onClick={() => act(() => socialApi.acceptDuel(id), "Couldn’t accept the invite.")}>
              <Swords /> Play
            </Button>
          </div>
        )}
      </Page>
    );
  }

  // ---------- no duel after all ----------
  if (duel.status === "declined" || duel.status === "expired" || duel.status === "cancelled") {
    const text =
      duel.status === "declined"
        ? duel.my_role === "challenger"
          ? `${them.display_name} said not now.`
          : "You said not now to this duel."
        : duel.status === "expired"
          ? "The invite ran out of time."
          : duel.my_role === "challenger"
            ? "You called off this duel."
            : `${them.display_name} called off the duel.`;
    return (
      <Page className="max-w-[720px]">
        {header}
        <Notice tone="info">{text}</Notice>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link href="/play/challenge/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
            Challenge someone
          </Link>
          <Link href="/friends" className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>
            Back to Friends
          </Link>
        </div>
      </Page>
    );
  }

  // ---------- playing ----------
  if (duel.status === "active") {
    const toStart = secs(duel.start_at);
    if (toStart > 0 || !duel.questions)
      return (
        <Page className="max-w-[720px]">
          {versus}
          <Card className="flex flex-col items-center gap-1 p-6 text-center" aria-live="polite">
            <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">
              YOU VS {them.display_name.toUpperCase()}
            </span>
            <span className="text-[56px] leading-none font-black">{toStart > 0 ? toStart : "Go!"}</span>
            <span className="text-[15px] font-bold text-muted-foreground">Get ready. The first question is coming.</span>
          </Card>
        </Page>
      );

    const total = duel.questions.length;
    const next = duel.progress.me;
    const timeLeft = secs(duel.ends_at);
    const race = (
      <Card className="flex flex-col gap-2 p-3.5">
        <span className="flex items-center justify-between text-[13px] font-black">
          <span className="flex items-center gap-1.5">
            <Face id={them.avatar} size={24} tint={tintOf(them.avatar)} /> {them.display_name} · {duel.progress.opponent} of {total}
          </span>
          <span className={cn("flex items-center gap-1", timeLeft <= 10 && "text-rose-ink")}>
            <Timer className="size-4" /> {timeLeft}s
          </span>
        </span>
        <ProgressBar value={(duel.progress.opponent / total) * 100} tone="sun" className="h-2" />
      </Card>
    );
    if (next < total)
      return (
        <Page className="max-w-[860px]">
          {race}
          <DuelQuestion player={{ name: me.display_name, avatar: me.avatar }} q={duel.questions[next]} n={next} total={total} onAnswer={(choice) => answer(next, choice)} />
          {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
          <p className="text-center text-[13px] font-bold text-muted-foreground">{sending !== null ? "Sending…" : "Your answer locks in as soon as you tap it."}</p>
        </Page>
      );
    return (
      <Page className="max-w-[720px]">
        {race}
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <Hourglass className="size-8 text-brand motion-safe:animate-pulse" />
          <span className="text-[22px] font-black">All done!</span>
          <span className="text-[15px] font-bold text-muted-foreground">Waiting for {them.display_name} to finish. Results show when they’re done or the time runs out.</span>
        </Card>
      </Page>
    );
  }

  // ---------- results ----------
  const results = duel.results!;
  const { me: mine, opponent: theirs, winner } = results;
  return (
    <Page className="max-w-[960px]">
      {header}
      <Stage className="h-[280px] md:h-[320px]">
        <span className="absolute inset-x-0 top-5 text-center text-[26px] font-black md:text-[30px]">{winner === "draw" ? "It’s a draw!" : winner === "me" ? "You win!" : `${them.display_name} wins!`}</span>
        <span className="absolute inset-x-0 top-[62px] text-center text-[15px] font-extrabold text-[#3f6470]">
          You {mine.score} · {them.display_name} {theirs.score} · out of {mine.total}
        </span>
        <div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
        <Sprite id={me.avatar} className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[88%] md:w-[230px]" alt={me.display_name} />
        <Sprite id={them.avatar} flip className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[12%] md:w-[230px]" alt={them.display_name} />
        {winner !== "draw" && <Trophy className={cn("absolute top-[110px] size-9 text-[#f5b93a]", winner === "me" ? "left-[22%]" : "right-[22%]")} />}
      </Stage>
      <Card className="flex items-center gap-3 p-4">
        <Coin size={28} />
        <span className="flex-1 text-[15px] font-extrabold">
          You earned <b>+{coinsFor(mine.score)} coins</b> ({mine.score} right + 20 for playing)
        </span>
      </Card>
      {duel.questions && <DuelReview questions={duel.questions} names={["You", them.display_name]} sheets={[mine.results, theirs.results]} />}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Link href={`/play/challenge/new?friend=${encodeURIComponent(them.id)}`} className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Rematch
        </Link>
        <Link href="/friends" className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>
          Back to Friends
        </Link>
      </div>
    </Page>
  );
}
