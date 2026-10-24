"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Gift, Hand, MessagesSquare, RotateCcw, Timer, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Confetti } from "@/components/splash/confetti";
import { Avatar, Eyebrow, Page, Panel, Pill } from "@/components/kay/ui";
import { BLOCKS } from "@/lib/kay/content";
import { OPPONENTS, type Person } from "@/lib/kay/data";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

/**
 * Practice match, fully local. In the real app each phone subscribes to the
 * same match (e.g. a Supabase Realtime channel) and these phases come from it.
 */

type Phase = "lobby" | "countdown" | "question" | "challenge" | "results";

const QUESTIONS = [BLOCKS[0].quiz[0], BLOCKS[1].quiz[1], BLOCKS[3].quiz[0]];
const OPP_CORRECT = [true, false, true];
const Q_POINTS = 20;
const CHALLENGE_POINTS = 30;

const CHALLENGES = {
  main: {
    title: "Build the Solar System!",
    steps: [
      "Grab 8 things from around you (fruit, socks, toys…)",
      "Line them up in planet order from the Sun",
      "Show your partner on camera or in person",
    ],
  },
  alt: {
    title: "Talk it through",
    steps: [
      "Take turns naming the planets in order from the Sun",
      "For each one, say one fact you learned",
      "Your partner says 'yes!' or helps fix it",
    ],
  },
};

export default function Match() {
  const { me, partner } = useSession();
  const mate: Person = partner ?? { name: "Kay bot", role: "solo", color: "grape", accessory: "glasses" };
  const opp = OPPONENTS[0];

  const [phase, setPhase] = useState<Phase>("lobby");
  const [ready, setReady] = useState<string[]>([]);
  const [count, setCount] = useState(3);
  const [qi, setQi] = useState(0);
  const [myPick, setMyPick] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [mateLocked, setMateLocked] = useState(false);
  const [score, setScore] = useState({ us: 0, them: 0 });
  const [altChallenge, setAltChallenge] = useState(false);
  const [challengeLeft, setChallengeLeft] = useState(90);

  const q = QUESTIONS[qi];
  // Demo teammate: right on Q1 and Q3, picks differently on Q2 to show the "talk it over" moment.
  const matePick = qi === 1 ? (q.answer + 1) % q.options.length : q.answer;
  const revealed = locked && mateLocked;

  // Lobby: everyone else gets ready one by one.
  useEffect(() => {
    if (phase !== "lobby") return;
    const others = [mate.name, ...opp.members.map((m) => m.name)];
    const next = others.find((n) => !ready.includes(n));
    if (!next) return;
    const t = setTimeout(() => setReady((r) => [...r, next]), 900);
    return () => clearTimeout(t);
  }, [phase, ready, mate.name, opp.members]);

  // Countdown 3-2-1.
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => (count > 1 ? setCount(count - 1) : setPhase("question")), 800);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Teammate locks in a little after each question appears.
  useEffect(() => {
    if (phase !== "question" || mateLocked) return;
    const t = setTimeout(() => setMateLocked(true), 2200);
    return () => clearTimeout(t);
  }, [phase, qi, mateLocked]);

  // Challenge timer.
  useEffect(() => {
    if (phase !== "challenge" || challengeLeft <= 0) return;
    const t = setTimeout(() => setChallengeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, challengeLeft]);

  const lockIn = () => {
    if (myPick === null) return;
    setLocked(true);
    setScore((s) => ({
      us: s.us + (myPick === q.answer ? Q_POINTS : 0),
      them: s.them + (OPP_CORRECT[qi] ? Q_POINTS : 0),
    }));
  };

  const nextQuestion = () => {
    if (qi + 1 < QUESTIONS.length) {
      setQi(qi + 1);
      setMyPick(null);
      setLocked(false);
      setMateLocked(false);
    } else setPhase("challenge");
  };

  const finishChallenge = () => {
    setScore((s) => ({ us: s.us + CHALLENGE_POINTS, them: s.them + 20 }));
    setPhase("results");
  };

  const allReady = ready.includes(me.name) && ready.length === 4;
  const won = score.us > score.them;

  const scoreBar = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-ink p-2 text-white" aria-live="polite">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 -space-x-2" aria-hidden>
          <Avatar person={me} size={28} />
          <Avatar person={mate} size={28} />
        </div>
        <span className="truncate text-sm font-bold">Us</span>
      </div>
      <p className="whitespace-nowrap font-heading text-2xl font-bold tabular-nums">
        {score.us} <span className="text-white/50">–</span> {score.them}
      </p>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <span className="truncate text-sm font-bold">{opp.name}</span>
        <div className="flex shrink-0 -space-x-2" aria-hidden>
          {opp.members.map((m) => (
            <Avatar key={m.name} person={m} size={28} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Page
      nav={false}
      back="/compete"
      title={phase === "lobby" ? "Practice match" : undefined}
      actions={phase !== "lobby" && phase !== "results" && <div className="flex-1">{scoreBar}</div>}
      footer={
        phase === "lobby" ? (
          ready.includes(me.name) ? (
            <Button size="game" className="w-full" disabled={!allReady} onClick={() => setPhase("countdown")}>
              {allReady ? "Start match" : "Waiting for everyone…"}
            </Button>
          ) : (
            <Button variant="sun" size="game" className="w-full" onClick={() => setReady((r) => [...r, me.name])}>
              <Hand /> I&apos;m ready
            </Button>
          )
        ) : phase === "question" ? (
          revealed ? (
            <Button size="game" className="w-full" onClick={nextQuestion}>
              {qi + 1 < QUESTIONS.length ? "Next question" : "On to the challenge"} <ArrowRight />
            </Button>
          ) : (
            <Button size="game" className="w-full" disabled={myPick === null || locked} onClick={lockIn}>
              {locked ? `Waiting for ${mate.name}…` : "Lock in our answer"}
            </Button>
          )
        ) : phase === "challenge" ? (
          <Button variant="mint" size="game" className="w-full" onClick={finishChallenge}>
            <Check /> We did it!
          </Button>
        ) : null
      }
    >
      {phase === "lobby" && (
        <>
          <p className="text-muted-foreground">Week topic: The Solar System · 3 questions + 1 challenge</p>
          {[
            { name: "Your team", members: [me, mate], tone: "bg-sky/15" },
            { name: opp.name, members: opp.members, tone: "bg-coral/15" },
          ].map((team, ti) => (
            <div key={team.name} className="flex flex-col gap-2">
              {ti === 1 && (
                <p className="text-center font-heading text-2xl font-bold text-muted-foreground" aria-hidden>
                  VS
                </p>
              )}
              <Panel className={cn("flex flex-col gap-3", team.tone)}>
                <Eyebrow>{team.name}</Eyebrow>
                <ul className="grid grid-cols-2 gap-3">
                  {team.members.map((m) => {
                    const isReady = ready.includes(m.name);
                    return (
                      <li key={m.name} className="flex flex-col items-center gap-1 text-center">
                        <Avatar person={m} size={72} mood={isReady ? "happy" : "sleepy"} className={cn(!isReady && "opacity-60")} />
                        <span className="font-bold">{m.name === me.name ? "You" : m.name}</span>
                        <Pill tone={isReady ? "mint" : "muted"}>{isReady ? "Ready" : "Getting ready…"}</Pill>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>
          ))}
        </>
      )}

      {phase === "countdown" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4" aria-live="assertive">
          {scoreBar}
          <p key={count} className="font-heading text-[9rem] font-bold leading-none animate-pop">
            {count}
          </p>
          <p className="font-heading text-2xl font-semibold">Get ready!</p>
        </div>
      )}

      {phase === "question" && (
        <>
          <div className="flex items-center justify-between">
            <Eyebrow>
              Round 1 · Question {qi + 1} of {QUESTIONS.length}
            </Eyebrow>
            <Pill tone="sun">
              <Timer className="size-3.5" aria-hidden /> Team answer
            </Pill>
          </div>
          <fieldset key={q.id} className="flex flex-col gap-3 animate-rise">
            <legend className="mb-4 text-balance font-heading text-3xl font-semibold leading-tight">{q.prompt}</legend>
            {q.options.map((opt, oi) => {
              const mine = myPick === oi;
              const theirs = mateLocked && matePick === oi;
              const right = revealed && oi === q.answer;
              const wrong = revealed && mine && oi !== q.answer;
              return (
                <label
                  key={opt}
                  className={cn(
                    "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-lg font-semibold transition",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    mine && !revealed && "border-primary bg-primary/8",
                    right && "border-success bg-mint/20",
                    wrong && "border-destructive bg-destructive/8",
                  )}
                >
                  <input type="radio" name={q.id} className="sr-only" checked={mine} disabled={locked} onChange={() => setMyPick(oi)} />
                  {opt}
                  <span className="ml-auto flex -space-x-2">
                    {mine && <Avatar person={me} size={30} />}
                    {theirs && <Avatar person={mate} size={30} className="animate-pop" />}
                  </span>
                  {theirs && <span className="sr-only">{mate.name} picked this</span>}
                </label>
              );
            })}
          </fieldset>
          <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
            <MessagesSquare className="size-4" aria-hidden />
            {revealed
              ? myPick === matePick
                ? `You and ${mate.name} agreed!`
                : `You and ${mate.name} picked differently. Your locked answer counted.`
              : mateLocked
              ? myPick !== null && myPick !== matePick
                ? `${mate.name} picked something different. Talk it over before you lock in!`
                : `${mate.name} has picked.`
              : `${mate.name} is thinking…`}
          </p>
          {revealed && (
            <div role="status" className={cn("rounded-2xl p-4 animate-pop", myPick === q.answer ? "bg-mint/25" : "bg-coral/20")}>
              <p className="font-heading text-xl font-semibold">
                {myPick === q.answer ? `+${Q_POINTS} for your team! 🎉` : "Not this time!"}
              </p>
              <p className="mt-1 text-sm">{q.explanation}</p>
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {opp.name} {OPP_CORRECT[qi] ? "got it right too." : "got it wrong."}
              </p>
            </div>
          )}
        </>
      )}

      {phase === "challenge" && (
        <>
          <div className="flex items-center justify-between">
            <Eyebrow>Round 2 · Practical challenge</Eyebrow>
            <Pill tone={challengeLeft < 20 ? "coral" : "sun"}>
              <Timer className="size-3.5" aria-hidden /> {Math.floor(challengeLeft / 60)}:{String(challengeLeft % 60).padStart(2, "0")}
            </Pill>
          </div>
          {(() => {
            const c = CHALLENGES[altChallenge ? "alt" : "main"];
            return (
              <Panel key={altChallenge ? "alt" : "main"} className="flex flex-col gap-4 bg-sun/15 animate-rise">
                <span className="text-6xl" aria-hidden>
                  {altChallenge ? "🗣️" : "🛠️"}
                </span>
                <h2 className="font-heading text-3xl font-bold">{c.title}</h2>
                <ol className="flex flex-col gap-2">
                  {c.steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-lg">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink font-heading text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                <p className="text-sm font-bold">Worth {CHALLENGE_POINTS} points · same points either way</p>
              </Panel>
            );
          })()}
          <Button variant="glass" className="h-11 rounded-full" onClick={() => setAltChallenge(!altChallenge)} aria-pressed={altChallenge}>
            {altChallenge ? "Switch back to the build challenge" : "Can't do this one? Swap for a talk-it-through challenge"}
          </Button>
        </>
      )}

      {phase === "results" && (
        <div className="flex flex-col items-center gap-4 text-center animate-rise">
          {won && <Confetti />}
          <span className="text-7xl" aria-hidden>
            {won ? "🏆" : "🤝"}
          </span>
          <h1 className="font-heading text-4xl font-bold">{won ? "You won!" : "Great match!"}</h1>
          <div className="w-full">{scoreBar}</div>
          <Panel className="flex w-full flex-col gap-2 text-left">
            <p className="font-heading text-lg font-semibold">Match highlights</p>
            <p>✅ {score.us >= 50 ? "Strong" : "Solid"} teamwork on the quiz round</p>
            <p>🛠️ Challenge complete: +{CHALLENGE_POINTS} pts</p>
            <p>📚 Worth a review: <strong>Why Venus is hottest</strong></p>
          </Panel>
          <Panel className="flex w-full items-center gap-3 border-grape/40 bg-grape/12 text-left">
            <Gift className="size-9 shrink-0 text-grape" aria-hidden />
            <div className="flex-1">
              <p className="font-heading text-lg font-semibold">You earned a reward box!</p>
              <p className="text-sm text-muted-foreground">Plus {score.us} points for your team.</p>
            </div>
            <Link href="/rewards#box" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-4")}>
              Open
            </Link>
          </Panel>
          <div className="flex w-full flex-col gap-2">
            <Button
              size="game"
              onClick={() => {
                setPhase("lobby");
                setReady([]);
                setQi(0);
                setMyPick(null);
                setLocked(false);
                setMateLocked(false);
                setScore({ us: 0, them: 0 });
                setChallengeLeft(90);
                setCount(3);
              }}
            >
              <RotateCcw /> Rematch
            </Button>
            <Link href="/compete" className={cn(buttonVariants({ variant: "glass", size: "game" }))}>
              <X /> Done
            </Link>
          </div>
        </div>
      )}
    </Page>
  );
}
