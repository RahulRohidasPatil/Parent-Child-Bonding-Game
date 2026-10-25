"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Layers, RotateCcw, Target, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { VisualFrame } from "@/components/qn/visual-frame";
import { Card, Coin, Notice, PageHeader, ProgressBar, Spinner, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type CheckOut, type PublicQuiz, learnApi } from "@/lib/learn-api";
import { homeApi } from "@/lib/home-api";
import { bump, getState, markStudiedToday, remember } from "@/lib/store";
import { cn } from "@/lib/utils";

type Answer = { choice: number; result: CheckOut };
const KEYS = "ABCDEFGH";
const COINS_PER_RIGHT = 10; // what the server pays per first-try-correct answer

function loadAnswers(id: string): Record<number, Answer> {
  try {
    return JSON.parse(sessionStorage.getItem(`qn.quiz.${id}`) || "{}");
  } catch {
    return {};
  }
}

/** Practice quiz: one question at a time; the server reveals each answer after you commit. */
export function QuizScreen({ id }: { id: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [idx, setIdx] = useState(0);
  const [checking, setChecking] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "followup" | "deck">(null);
  const [done, setDone] = useState(false);
  const [paid, setPaid] = useState<number | null>(null); // home coins credited; -1 if the claim failed

  useEffect(() => {
    learnApi
      .getQuiz(id)
      .then((q) => {
        const saved = loadAnswers(id);
        setQuiz(q);
        setAnswers(saved);
        const firstOpen = q.questions.findIndex((x) => !saved[x.index]);
        if (firstOpen === -1) setDone(true);
        else setIdx(firstOpen);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Couldn’t load the quiz."));
  }, [id]);

  const total = quiz?.questions.length ?? 0;
  const answered = Object.keys(answers).length;
  const right = Object.values(answers).filter((a) => a.result.correct).length;
  const wrong = answered - right;

  // Home coins come from the server, which pays each first-try-correct answer once, however often this runs.
  useEffect(() => {
    if (!done || !quiz) return;
    let live = true;
    homeApi.claimQuiz(quiz.id).then(
      (c) => live && setPaid(c.credited),
      () => live && setPaid(-1),
    );
    return () => {
      live = false;
    };
  }, [done, quiz]);

  // Quest progress and the recent list, once per quiz, when it is finished.
  useEffect(() => {
    if (!done || !quiz) return;
    try {
      if (sessionStorage.getItem(`qn.quizpaid.${id}`)) return;
      sessionStorage.setItem(`qn.quizpaid.${id}`, "1");
    } catch {
      /* without storage, quest progress may repeat after reload; acceptable for a prototype */
    }
    bump(["d-quiz"], answered);
    markStudiedToday();
    const r = getState().recent.find((x) => x.kind === "quiz" && x.id === id);
    remember({ kind: "quiz", id, title: quiz.title, lessonId: quiz.lesson_id, subject: r?.subject, detail: `Scored ${right}/${total}` });
  }, [done, quiz, id, right, answered, total]);

  async function pick(choice: number) {
    if (!quiz || checking !== null) return;
    const q = quiz.questions[idx];
    if (answers[q.index]) return;
    setChecking(choice);
    setError(null);
    try {
      const result = await learnApi.check(quiz.id, q.index, choice);
      const next = { ...answers, [q.index]: { choice, result } };
      setAnswers(next);
      try {
        sessionStorage.setItem(`qn.quiz.${id}`, JSON.stringify(next));
      } catch {
        /* fine */
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t check that answer. Try again.");
    } finally {
      setChecking(null);
    }
  }

  function next() {
    if (!quiz) return;
    if (idx + 1 < total) setIdx(idx + 1);
    else setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function weakSpots(kind: "followup" | "deck") {
    if (!quiz) return;
    setBusy(kind);
    setError(null);
    const subject = getState().recent.find((x) => x.kind === "quiz" && x.id === id)?.subject;
    try {
      if (kind === "followup") {
        const f = await learnApi.followup(quiz.id);
        remember({ kind: "quiz", id: f.id, title: `Weak spots: ${quiz.title}`, lessonId: quiz.lesson_id, subject, detail: f.focus?.join(", ") });
        bump(["w-weak"]);
        router.push(`/play/solo/quiz/${f.id}`);
      } else {
        const d = await learnApi.mistakesDeck(quiz.id, "missed");
        remember({ kind: "deck", id: d.id, title: `My mistakes: ${quiz.title}`, lessonId: quiz.lesson_id, subject, detail: `${d.cards.length} cards` });
        router.push(`/play/solo/flashcards/${d.id}`);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
      setBusy(null);
    }
  }

  if (loadError)
    return (
      <Page className="max-w-[760px]">
        <PageHeader title="Quiz" back={{ href: "/learn", label: "Back to Learn" }} />
        <Notice>{loadError}</Notice>
      </Page>
    );
  if (!quiz)
    return (
      <Page className="max-w-[760px]">
        <div className="flex items-center gap-2.5 p-8 font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand-ink" /> Loading the quiz…
        </div>
      </Page>
    );
  if (busy)
    return (
      <Page className="max-w-[760px]">
        <Working title={busy === "followup" ? "Writing new questions on your weak spots…" : "Making cards of your mistakes…"} />
      </Page>
    );

  // ---------- summary ----------
  if (done) {
    const pct = total ? Math.round((right / total) * 100) : 0;
    return (
      <Page className="max-w-[860px]">
        <PageHeader title="Quiz complete" sub={quiz.title} back={{ href: `/learn/lesson/${quiz.lesson_id}`, label: "Back to the lesson" }} />
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <span className="text-[44px] leading-none font-black">
            {right}/{total}
          </span>
          <span className="text-[15px] font-bold text-muted-foreground">{pct >= 80 ? "Brilliant work!" : pct >= 50 ? "Good going. A little more practice and you’ve got it." : "That was a tough one. Let’s practise the tricky parts."}</span>
          <span className="mt-2 flex items-center gap-2 rounded-full bg-coin px-3.5 py-1.5 text-[15px] font-black text-coin-ink" role="status">
            <Coin />
            {paid === null
              ? "Adding your coins…"
              : paid > 0
                ? `+${paid} coins for your base`
                : paid === 0
                  ? right > 0
                    ? "Coins already added for these answers"
                    : `Get answers right first time for ${COINS_PER_RIGHT} coins each`
                  : "Couldn’t add coins right now"}
          </span>
        </Card>

        {wrong > 0 && (
          <Card className="flex flex-col gap-3 border-[#f2a46a] p-4">
            <span className="flex items-center gap-2 text-[17px] font-black">
              <Target className="size-5 text-flame-ink" /> Practise your weak spots
            </span>
            <span className="text-[15px] font-bold text-muted-foreground">You missed {wrong}. Try different questions on the same ideas, or turn your mistakes into flashcards.</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <Button variant="brand" size="cta" onClick={() => weakSpots("followup")}>
                <RotateCcw /> New questions
              </Button>
              <Button variant="soft" size="cta" onClick={() => weakSpots("deck")}>
                <Layers /> Mistake cards
              </Button>
            </div>
          </Card>
        )}

        <ol className="flex flex-col gap-2.5">
          {quiz.questions.map((q, i) => {
            const a = answers[q.index];
            return (
              <li key={q.index}>
                <Card className="flex gap-3 p-3.5">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-white", a?.result.correct ? "bg-brand" : "bg-[#d24d4d]")}>
                    {a?.result.correct ? <Check className="size-[18px]" strokeWidth={3} /> : <X className="size-[18px]" strokeWidth={3} />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] font-black">
                      {i + 1}. {q.question}
                    </span>
                    {a && (
                      <span className="text-sm font-bold text-muted-foreground">
                        Answer: {q.options[a.result.answer_index]}
                        {!a.result.correct && ` · you chose ${q.options[a.choice]}`}
                      </span>
                    )}
                  </span>
                </Card>
              </li>
            );
          })}
        </ol>
        {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Link href={`/learn/lesson/${quiz.lesson_id}`} className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>
            Back to the lesson
          </Link>
          <Link href={`/play/duel?lesson=${quiz.lesson_id}`} className={cn(buttonVariants({ variant: "night", size: "cta" }))}>
            Challenge your family
          </Link>
        </div>
      </Page>
    );
  }

  // ---------- question ----------
  const q = quiz.questions[idx];
  const a = answers[q.index];
  return (
    <Page className="max-w-[860px]">
      <div className="flex items-center gap-3">
        <Link
          href={`/learn/lesson/${quiz.lesson_id}`}
          aria-label="Leave the quiz"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card hover:bg-muted"
        >
          <X className="size-5" strokeWidth={2.6} />
        </Link>
        <ProgressBar value={((idx + (a ? 1 : 0)) / total) * 100} className="h-3 flex-1" />
        <span className="text-sm font-black whitespace-nowrap">
          {idx + 1} / {total}
        </span>
      </div>

      {quiz.focus && quiz.focus.length > 0 && <Notice tone="info">Practising: {quiz.focus.join(", ")}</Notice>}

      <Card className="flex flex-col gap-3 p-4 md:p-6">
        <span className="text-xs font-black tracking-[.06em] text-brand-ink uppercase">{q.type === "true_false" ? "True or false" : "Question"}</span>
        <h1 className="text-[20px] leading-snug font-black md:text-[24px]">{q.question}</h1>
        {(a?.result.answer_visual_html || q.visual_html) && <VisualFrame html={(a?.result.answer_visual_html || q.visual_html)!} title="Lesson diagram" />}
      </Card>

      {q.options.length === 0 ? (
        <Notice tone="warn">This question can’t be answered here. Skip to the next one.</Notice>
      ) : (
        <div className={cn("grid gap-2.5", q.options.length === 2 ? "grid-cols-2" : "md:grid-cols-2")}>
          {q.options.map((opt, i) => {
            const isAnswer = a && i === a.result.answer_index;
            const isWrongPick = a && i === a.choice && !a.result.correct;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                disabled={!!a || checking !== null}
                aria-pressed={a ? i === a.choice : undefined}
                className={cn(
                  "flex min-h-[60px] items-center gap-3 rounded-2xl border p-3 text-left text-[16px] font-extrabold transition-colors disabled:cursor-default",
                  isAnswer
                    ? "border-2 border-brand bg-brand-soft shadow-[0_3px_0_var(--mint-line)]"
                    : isWrongPick
                      ? "border-2 border-[#d24d4d] bg-danger-soft shadow-[0_3px_0_var(--danger-soft)]"
                      : "border-line bg-card shadow-[0_3px_0_var(--line)] enabled:hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-black",
                    isAnswer ? "bg-brand text-white" : isWrongPick ? "bg-[#d24d4d] text-white" : "bg-muted",
                  )}
                >
                  {checking === i ? <Spinner className="size-4" /> : KEYS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {a && (
        <Card className={cn("flex flex-col gap-1 p-4", a.result.correct ? "bg-brand-soft" : "bg-flame")} role="status">
          <span className={cn("text-[15px] font-black", a.result.correct ? "text-brand-dark" : "text-flame-ink")}>{a.result.correct ? "Correct!" : "Not quite"}</span>
          <span className="text-[15px] leading-relaxed font-bold">{a.result.explanation}</span>
        </Card>
      )}
      {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
      {(a || q.options.length === 0) && (
        <Button variant="brand" size="cta" onClick={next}>
          {idx + 1 < total ? "Next question" : "See my results"}
        </Button>
      )}
    </Page>
  );
}
