"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Hourglass, Swords, Trophy } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { DuelQuestion, DuelReview } from "@/components/qn/duel";
import { Sprite, Stage } from "@/components/qn/sprite";
import { Card, Coin, Notice, PageHeader, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { type ChallengeView, FriendsError, friendsApi } from "@/lib/friends-api";
import { addCoins, bump, markStudiedToday } from "@/lib/store";
import { cn } from "@/lib/utils";

const POLL_MS = 10_000;
const coinsFor = (score: number) => score * 10 + 20;

/** A duel with a friend: each player answers the same questions on their own phone, in any order. */
export function ChallengeScreen({ id }: { id: string }) {
  const [view, setView] = useState<ChallengeView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"intro" | "answer" | "sending">("intro");
  const [qi, setQi] = useState(0);
  const [sheet, setSheet] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setView(await friendsApi.getChallenge(id));
    } catch (e) {
      setLoadError(e instanceof FriendsError ? e.message : "Couldn’t load the duel.");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of server data
    load();
  }, [load]);

  // While waiting for the friend, check now and then whether they've played.
  const waiting = view?.status === "waiting";
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(t);
  }, [waiting, load]);

  async function submit(answers: number[]) {
    setPhase("sending");
    try {
      const v = await friendsApi.submit(id, answers);
      setView(v);
      if (v.mine) addCoins(coinsFor(v.mine.score));
      bump(["d-duel", "w-duels"]);
      markStudiedToday();
    } catch (e) {
      setError(e instanceof FriendsError ? e.message : "Couldn’t send your answers. Try again.");
      setPhase("answer");
    }
  }

  function answer(choice: number) {
    if (!view) return;
    const next = [...sheet];
    next[qi] = choice;
    setSheet(next);
    if (qi + 1 < view.questions.length) setQi(qi + 1);
    else submit(next);
  }

  async function decline() {
    setBusy(true);
    try {
      await friendsApi.decline(id);
      await load();
    } catch (e) {
      setError(e instanceof FriendsError ? e.message : "Couldn’t call off the duel.");
    } finally {
      setBusy(false);
    }
  }

  const back = { href: "/friends", label: "Back to Friends" };
  if (!view)
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Friend duel" back={back} />
        {loadError ? <Notice>{loadError}</Notice> : <Working title="Loading the duel…" />}
      </Page>
    );

  const { me, opponent } = view;
  const total = view.questions.length;

  if (view.status === "declined")
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Friend duel" sub={view.lessonTitle} back={back} />
        <Notice tone="info">{view.sentByMe ? `${opponent.name} said no to this duel, or it was called off.` : `This duel with ${opponent.name} was called off.`}</Notice>
        <Link href="/friends" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Back to Friends
        </Link>
      </Page>
    );

  // ---------- my turn ----------
  if (view.status === "your-turn") {
    if (phase === "sending") return <Page className="max-w-[720px]"><Working title="Scoring your answers…" /></Page>;
    if (phase === "answer")
      return (
        <Page className="max-w-[860px]">
          <DuelQuestion player={me} q={view.questions[qi]} n={qi} total={total} onAnswer={answer} />
          {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
          <p className="text-center text-[13px] font-bold text-muted-foreground">Your answer is saved as soon as you tap it.</p>
        </Page>
      );
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Friend duel" sub={view.lessonTitle} back={back} />
        <Stage className="h-[260px] md:h-[300px]">
          <div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
          <Sprite id={me.avatar} className="absolute bottom-4 left-1/2 w-[180px] -translate-x-[88%] md:w-[210px]" alt={me.name} />
          <Sprite id={opponent.avatar} flip className="absolute bottom-4 left-1/2 w-[180px] -translate-x-[12%] md:w-[210px]" alt={opponent.name} />
        </Stage>
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <span className="flex items-center gap-2 text-[13px] font-black tracking-[.04em] text-muted-foreground">
            <Swords className="size-4" /> {view.sentByMe ? `YOU VS ${opponent.name.toUpperCase()}` : `${opponent.name.toUpperCase()} CHALLENGED YOU`}
          </span>
          <span className="text-[24px] font-black">
            {total} questions on {view.lessonTitle}
          </span>
          <span className="text-[15px] font-bold text-muted-foreground">No timer. You each answer on your own phone, then see who knew more and why.</span>
        </Card>
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
        <Button variant="brand" size="cta" onClick={() => setPhase("answer")}>
          Start
        </Button>
        {!view.sentByMe && (
          <Button variant="soft" size="cta" onClick={decline} disabled={busy}>
            Not now
          </Button>
        )}
      </Page>
    );
  }

  const mine = view.mine!;
  const reward = (
    <Card className="flex items-center gap-3 p-4">
      <Coin size={28} />
      <span className="flex-1 text-[15px] font-extrabold">
        You earned <b>+{coinsFor(mine.score)} coins</b> ({mine.score} right + 20 for playing)
      </span>
    </Card>
  );

  // ---------- waiting for the friend ----------
  if (view.status === "waiting" || !view.theirs)
    return (
      <Page className="max-w-[960px]">
        <PageHeader title="Friend duel" sub={view.lessonTitle} back={back} />
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <Hourglass className="size-8 text-brand" />
          <span className="text-[24px] font-black">
            You got {mine.score} of {mine.total}
          </span>
          <span className="text-[15px] font-bold text-muted-foreground">Waiting for {opponent.name} to play. We’ll show who won as soon as they’re done.</span>
        </Card>
        {reward}
        <DuelReview questions={view.questions} names={["You"]} sheets={[mine.results]} />
        {view.sentByMe && (
          <Button variant="soft" size="cta" onClick={decline} disabled={busy}>
            Call off the duel
          </Button>
        )}
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
      </Page>
    );

  // ---------- both done ----------
  const theirs = view.theirs;
  const winner = mine.score === theirs.score ? null : mine.score > theirs.score ? 0 : 1;
  return (
    <Page className="max-w-[960px]">
      <PageHeader title="Friend duel" sub={view.lessonTitle} back={back} />
      <Stage className="h-[280px] md:h-[320px]">
        <span className="absolute inset-x-0 top-5 text-center text-[26px] font-black md:text-[30px]">{winner === null ? "It’s a draw!" : winner === 0 ? "You win!" : `${opponent.name} wins!`}</span>
        <span className="absolute inset-x-0 top-[62px] text-center text-[15px] font-extrabold text-[#3f6470]">
          You {mine.score} · {opponent.name} {theirs.score} · out of {total}
        </span>
        <div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
        <Sprite id={me.avatar} className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[88%] md:w-[230px]" alt={me.name} />
        <Sprite id={opponent.avatar} flip className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[12%] md:w-[230px]" alt={opponent.name} />
        {winner !== null && <Trophy className={cn("absolute top-[110px] size-9 text-[#f5b93a]", winner === 0 ? "left-[22%]" : "right-[22%]")} />}
      </Stage>
      {reward}
      <DuelReview questions={view.questions} names={["You", opponent.name]} sheets={[mine.results, theirs.results]} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Link href={`/play/challenge/new?friend=${encodeURIComponent(opponent.id)}`} className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Rematch
        </Link>
        <Link href="/friends" className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>
          Back to Friends
        </Link>
      </div>
    </Page>
  );
}
