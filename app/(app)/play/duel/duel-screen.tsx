"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, EyeOff, Swords, Trophy, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Face, Sprite, Stage } from "@/components/qn/sprite";
import { Card, Coin, EmptyState, Field, Notice, PageHeader, ProgressBar, Segmented, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type PublicQuiz, type SubmitOut, learnApi } from "@/lib/learn-api";
import { addCoins, bump, markStudiedToday, remember, useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";
import { AVATARS, type AvatarId } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

type Player = { name: string; avatar: AvatarId };
type Phase = "setup" | "creating" | "handoff" | "answer" | "scoring" | "results";
const KEYS = "ABCDEFGH";

/**
 * Pass-the-phone duel on the tournament API: one tournament (same questions), each player
 * answers in secret, then both answer sheets are submitted and compared.
 */
export function DuelScreen() {
  const params = useSearchParams();
  const { user } = useUser();
  const recent = useQN((s) => s.recent);
  const look = useQN((s) => s.look);
  const lessons = recent.filter((r) => r.kind === "lesson");

  const [chosenLesson, setLessonId] = useState<string | null>(null);
  const lessonId = chosenLesson ?? params.get("lesson") ?? lessons[0]?.id ?? "";
  const [count, setCount] = useState<"3" | "5" | "8">("5");
  const [names, setNames] = useState<[string | null, string]>([null, "Mom"]);
  const [p2Avatar, setP2Avatar] = useState<AvatarId>("mom");
  // Player 1 is the signed-in learner (their look); the name defaults to their first name.
  const players: [Player, Player] = [
    { name: names[0] ?? (user?.name?.split(" ")[0] || "Me"), avatar: look },
    { name: names[1], avatar: p2Avatar === look ? (look === "mom" ? "dad" : "mom") : p2Avatar },
  ];
  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [qi, setQi] = useState(0);
  const [sheets, setSheets] = useState<[number[], number[]]>([[], []]);
  const [results, setResults] = useState<[SubmitOut, SubmitOut] | null>(null);
  const [error, setError] = useState<string | null>(null);


  const lessonTitle = lessons.find((l) => l.id === lessonId)?.title ?? "your lesson";

  async function start() {
    if (!lessonId) return setError("Pick a lesson first.");
    if (!players[0].name.trim() || !players[1].name.trim()) return setError("Give both players a name.");
    setError(null);
    setPhase("creating");
    try {
      const t = await learnApi.createTournament(lessonId, Number(count));
      setQuiz(t);
      setSheets([[], []]);
      setTurn(0);
      setQi(0);
      setPhase("handoff");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t set up the duel. Try again.");
      setPhase("setup");
    }
  }

  function answer(choice: number) {
    if (!quiz) return;
    const next: [number[], number[]] = [[...sheets[0]], [...sheets[1]]];
    next[turn][qi] = choice;
    setSheets(next);
    if (qi + 1 < quiz.questions.length) {
      setQi(qi + 1);
      return;
    }
    if (turn === 0) {
      setTurn(1);
      setQi(0);
      setPhase("handoff");
    } else {
      score(next);
    }
  }

  async function score(s: [number[], number[]]) {
    if (!quiz) return;
    setPhase("scoring");
    try {
      const [a, b] = await Promise.all([learnApi.submitTournament(quiz.id, s[0]), learnApi.submitTournament(quiz.id, s[1])]);
      setResults([a, b]);
      setPhase("results");
      addCoins(a.score * 10 + 20);
      bump(["d-duel", "w-duels"]);
      markStudiedToday();
      remember({ kind: "duel", id: quiz.id, title: `Duel: ${lessonTitle}`, lessonId, detail: `${players[0].name} ${a.score} · ${players[1].name} ${b.score}` });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t score the duel.");
      setPhase("answer");
    }
  }

  // ---------- setup ----------
  if (phase === "setup")
    return (
      <Page className="max-w-[880px]">
        <PageHeader title="Family duel" sub="One phone, two players, same questions" back={{ href: "/play", label: "Back to Play" }} />
        {lessons.length === 0 ? (
          <EmptyState
            title="Make a lesson first"
            action={
              <Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
                New lesson
              </Link>
            }
          >
            Duel questions come from one of your lessons.
          </EmptyState>
        ) : (
          <>
            <Card className="flex flex-col gap-3 p-4">
              <span className="text-[15px] font-black">Lesson</span>
              <div role="radiogroup" aria-label="Lesson" className="flex flex-col gap-2">
                {lessons.slice(0, 6).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="radio"
                    aria-checked={l.id === lessonId}
                    onClick={() => setLessonId(l.id)}
                    className={cn(
                      "rounded-2xl border px-3.5 py-3 text-left text-[15px] font-extrabold",
                      l.id === lessonId ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted",
                    )}
                  >
                    {l.title}
                  </button>
                ))}
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {players.map((p, i) => (
                <Card key={i} className="flex flex-col gap-3 p-4">
                  <span className="flex items-center gap-3">
                    <Face id={p.avatar} size={52} tint={AVATARS.find((a) => a.id === p.avatar)?.tint} />
                    <span className="text-[15px] font-black">Player {i + 1}</span>
                  </span>
                  <Field
                    label="Name"
                    maxLength={20}
                    value={p.name}
                    onChange={(e) => setNames((n) => (i === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))}
                  />
                  {i === 1 && (
                    <div role="radiogroup" aria-label="Player 2 look" className="flex flex-wrap gap-2">
                      {AVATARS.filter((a) => a.id !== players[0].avatar).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          role="radio"
                          aria-checked={p.avatar === a.id}
                          aria-label={a.label}
                          onClick={() => setP2Avatar(a.id)}
                          className={cn("rounded-full", p.avatar === a.id && "ring-3 ring-brand")}
                        >
                          <Face id={a.id} size={40} tint={a.tint} />
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <Card className="flex flex-col gap-3 p-4">
              <span className="text-[15px] font-black">Questions</span>
              <Segmented label="Number of questions" value={count} onChange={setCount} options={[{ value: "3", label: "3" }, { value: "5", label: "5" }, { value: "8", label: "8" }]} />
              <span className="text-[13px] font-bold text-muted-foreground">No timer. Answers stay hidden until both players are done.</span>
            </Card>
            {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
            <Button variant="brand" size="cta" onClick={start}>
              <Swords /> Start the duel
            </Button>
          </>
        )}
      </Page>
    );

  if (phase === "creating") return <Page className="max-w-[720px]"><Working title="Setting up the duel…" steps={["Reading the lesson", "Writing questions", "Checking the answers"]} /></Page>;
  if (phase === "scoring") return <Page className="max-w-[720px]"><Working title="Scoring both players…" /></Page>;
  if (!quiz) return null;

  const player = players[turn];
  // ---------- handoff ----------
  if (phase === "handoff")
    return (
      <Page className="max-w-[720px]">
        <Stage className="flex h-[300px] items-end justify-center md:h-[360px]">
          <div className="absolute bottom-5 left-1/2 h-6 w-[200px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
          <Sprite id={player.avatar} className="relative bottom-5 w-[240px] md:w-[300px]" alt={player.name} />
        </Stage>
        <Card className="flex flex-col items-center gap-2 p-5 text-center">
          <span className="flex items-center gap-2 text-[13px] font-black tracking-[.04em] text-muted-foreground">
            <EyeOff className="size-4" /> {turn === 0 ? "EVERYONE ELSE, LOOK AWAY" : `${players[0].name.toUpperCase()} IS DONE`}
          </span>
          <span className="text-[24px] font-black">{turn === 0 ? `${player.name} goes first` : `Pass the phone to ${player.name}`}</span>
          <span className="text-[15px] font-bold text-muted-foreground">
            {quiz.questions.length} questions on {lessonTitle}. Answers are revealed at the end.
          </span>
        </Card>
        <Button variant="brand" size="cta" onClick={() => setPhase("answer")}>
          I’m {player.name}, start
        </Button>
      </Page>
    );

  // ---------- answering ----------
  if (phase === "answer") {
    const q = quiz.questions[qi];
    return (
      <Page className="max-w-[860px]">
        <div className="flex items-center gap-3">
          <Face id={player.avatar} size={44} tint={AVATARS.find((a) => a.id === player.avatar)?.tint} />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-sm font-black">
              {player.name}’s turn · {qi + 1} of {quiz.questions.length}
            </span>
            <ProgressBar value={(qi / quiz.questions.length) * 100} className="h-2.5" />
          </span>
        </div>
        <Card className="flex flex-col gap-2 p-4 md:p-6">
          <span className="text-xs font-black tracking-[.06em] text-brand-ink uppercase">{q.type === "true_false" ? "True or false" : "Question"}</span>
          <h1 className="text-[20px] leading-snug font-black md:text-[24px]">{q.question}</h1>
        </Card>
        <div className={cn("grid gap-2.5", q.options.length === 2 ? "grid-cols-2" : "md:grid-cols-2")}>
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => answer(i)}
              className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left text-[16px] font-extrabold shadow-[0_3px_0_var(--line)] hover:bg-muted"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted text-sm font-black">{KEYS[i]}</span>
              {o}
            </button>
          ))}
        </div>
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
        <p className="text-center text-[13px] font-bold text-muted-foreground">Your answer is saved as soon as you tap it.</p>
      </Page>
    );
  }

  // ---------- results ----------
  if (!results) return null;
  const [a, b] = results;
  const winner = a.score === b.score ? null : a.score > b.score ? 0 : 1;
  return (
    <Page className="max-w-[960px]">
      <Stage className="h-[280px] md:h-[320px]">
        <span className="absolute inset-x-0 top-5 text-center text-[26px] font-black md:text-[30px]">{winner === null ? "It’s a draw!" : `${players[winner].name} wins!`}</span>
        <span className="absolute inset-x-0 top-[62px] text-center text-[15px] font-extrabold text-stage-ink">
          {players[0].name} {a.score} · {players[1].name} {b.score} · out of {a.total}
        </span>
        <div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
        <Sprite id={players[0].avatar} className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[88%] md:w-[230px]" alt={players[0].name} />
        <Sprite id={players[1].avatar} flip className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[12%] md:w-[230px]" alt={players[1].name} />
        {winner !== null && <Trophy className={cn("absolute top-[110px] size-9 text-[#f5b93a]", winner === 0 ? "left-[22%]" : "right-[22%]")} />}
      </Stage>
      <Card className="flex items-center gap-3 p-4">
        <Coin size={28} />
        <span className="flex-1 text-[15px] font-extrabold">
          {players[0].name} earned <b>+{a.score * 10 + 20} coins</b> ({a.score} right + 20 for playing together)
        </span>
      </Card>
      <ol className="flex flex-col gap-3">
        {quiz.questions.map((q, i) => {
          const ra = a.results[i];
          const rb = b.results[i];
          return (
            <li key={q.index}>
              <Card className="flex flex-col gap-2.5 p-4">
                <span className="text-[16px] font-black">
                  {i + 1}. {q.question}
                </span>
                <span className="text-sm font-extrabold text-brand-dark">Answer: {q.options[ra.answer_index]}</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[ra, rb].map((r, p) => (
                    <span key={p} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold", r.correct ? "bg-brand-soft" : "bg-danger-soft")}>
                      {r.correct ? <Check className="size-4 text-brand-ink" strokeWidth={3} /> : <X className="size-4 text-danger-ink" strokeWidth={3} />}
                      {players[p].name}: {q.options[r.choice]}
                    </span>
                  ))}
                </div>
                <span className="text-sm leading-relaxed font-bold text-muted-foreground">{ra.explanation}</span>
              </Card>
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Button variant="brand" size="cta" onClick={() => setPhase("setup")}>
          New duel
        </Button>
        <Link href={`/learn/lesson/${lessonId}`} className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>
          Back to the lesson
        </Link>
      </div>
      {quiz.dropped >= 0 && (
        <p className="text-center text-[13px] font-bold text-muted-foreground">
          {quiz.dropped > 0 ? `${quiz.dropped} question${quiz.dropped === 1 ? " was" : "s were"} dropped because they failed the answer check.` : "Every question passed the answer check."}
        </p>
      )}
    </Page>
  );
}
