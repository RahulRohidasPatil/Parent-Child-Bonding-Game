"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, EyeOff, Swords, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Face, Sprite, Stage } from "@/components/qn/sprite";
import { VisualFrame } from "@/components/qn/visual-frame";
import { Card, Coin, EmptyState, Field, Notice, PageHeader, ProgressBar, Segmented, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type CheckOut, type PublicQuiz, learnApi } from "@/lib/learn-api";
import { addCoins, bump, markStudiedToday, remember, useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";
import { AVATARS, type AvatarId } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

type Mode = "family" | "duo" | "friends";
type Phase = "setup" | "creating" | "handoff" | "answer" | "scoring" | "results";
const titles: Record<Mode, string> = { family: "Family duel", duo: "Duo vs duo", friends: "Friends quiz" };
const defaults: Record<Mode, string[]> = { family: ["", "Mom"], duo: ["", "Mom", "Friend 1", "Friend 2"], friends: ["", "Friend 1", "Friend 2", "Friend 3"] };
const defaultAvatars: AvatarId[] = ["nova", "mom", "zara", "leo", "mia", "dad"];

export function McqScreen() {
  const params = useSearchParams();
  const mode: Mode = params.get("mode") === "duo" ? "duo" : params.get("mode") === "friends" ? "friends" : "family";
  const { user } = useUser();
  const look = useQN((s) => s.look);
  const lessons = useQN((s) => s.recent).filter((r) => r.kind === "lesson");
  const [chosenLesson, setLesson] = useState<string | null>(null);
  const lessonId = chosenLesson ?? params.get("lesson") ?? lessons[0]?.id ?? "";
  const lessonTitle = lessons.find((l) => l.id === lessonId)?.title ?? "your lesson";
  const [count, setCount] = useState<"3" | "5" | "8">("5");
  const [friendCount, setFriendCount] = useState<"2" | "3" | "4" | "5" | "6">("4");
  const playerCount = mode === "family" ? 2 : mode === "duo" ? 4 : Number(friendCount);
  const [names, setNames] = useState<Record<Mode, string[]>>(defaults);
  const [avatars, setAvatars] = useState<AvatarId[]>(defaultAvatars);
  const players = Array.from({ length: playerCount }, (_, i) => ({ name: i === 0 ? names[mode][0] || user?.name?.split(" ")[0] || "Me" : names[mode][i] || `Friend ${i}`, avatar: i === 0 ? look : avatars[i] }));
  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [turn, setTurn] = useState(0);
  const [qi, setQi] = useState(0);
  const [sheets, setSheets] = useState<number[][]>([]);
  const [grades, setGrades] = useState<CheckOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!lessonId) return setError("Pick a lesson first.");
    if (players.some((p) => !p.name.trim())) return setError("Give every player a name.");
    setError(null);
    setPhase("creating");
    try {
      const created = await learnApi.createQuiz(lessonId, Number(count));
      const loaded = await learnApi.getQuiz(created.id);
      const playable = loaded.questions.filter((q) => (q.type === "multiple_choice" || q.type === "true_false") && q.options.length >= 2);
      if (!playable.length) throw new Error("This quiz has no multiple choice questions. Try again.");
      setQuiz({ ...loaded, questions: playable });
      setSheets(Array.from({ length: playerCount }, () => []));
      setGrades(null);
      setTurn(0);
      setQi(0);
      setPhase("handoff");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t set up the quiz. Try again.");
      setPhase("setup");
    }
  }

  function answer(choice: number) {
    if (!quiz) return;
    const next = sheets.map((sheet) => [...sheet]);
    next[turn][qi] = choice;
    setSheets(next);
    if (qi + 1 < quiz.questions.length) setQi(qi + 1);
    else if (turn + 1 < playerCount) {
      setTurn(turn + 1);
      setQi(0);
      setPhase("handoff");
    } else void score(next);
  }

  async function score(answers: number[][]) {
    if (!quiz) return;
    setPhase("scoring");
    setError(null);
    try {
      // Check only after all turns. The API records the first answer per question,
      // while the returned answer_index lets us grade every private player sheet.
      const checked = await Promise.all(quiz.questions.map((q, i) => learnApi.check(quiz.id, q.index, answers[0][i])));
      setGrades(checked);
      setPhase("results");
      const firstScore = checked.reduce((sum, grade, i) => sum + Number(answers[0][i] === grade.answer_index), 0);
      addCoins(firstScore * 10 + 20);
      if (mode === "family") bump(["d-duel", "w-duels"]);
      markStudiedToday();
      remember({ kind: "duel", id: quiz.id, title: `${titles[mode]}: ${lessonTitle}`, lessonId, detail: `${players[0].name} ${firstScore}/${quiz.questions.length}` });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t check the answers. Try again.");
      setPhase("answer");
    }
  }

  if (phase === "setup") return <Page className="max-w-[880px]">
    <PageHeader title={titles[mode]} sub="One phone, same quiz, answers revealed at the end" back={{ href: "/play", label: "Back to Play" }} />
    {lessons.length === 0 ? <EmptyState title="Make a lesson first" action={<Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>New lesson</Link>}>Quiz questions come from one of your lessons.</EmptyState> : <>
      <Card className="flex flex-col gap-3 p-4"><span className="text-[15px] font-black">Lesson</span><div role="radiogroup" aria-label="Lesson" className="flex flex-col gap-2">{lessons.slice(0, 6).map((l) => <button key={l.id} type="button" role="radio" aria-checked={l.id === lessonId} onClick={() => setLesson(l.id)} className={cn("rounded-2xl border px-3.5 py-3 text-left text-[15px] font-extrabold", l.id === lessonId ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted")}>{l.title}</button>)}</div></Card>
      {mode === "friends" && <Card className="flex flex-col gap-3 p-4"><span className="text-[15px] font-black">Players</span><Segmented label="Number of players" value={friendCount} onChange={setFriendCount} options={(["2", "3", "4", "5", "6"] as const).map((v) => ({ value: v, label: v }))} /></Card>}
      {mode === "duo" && <p className="text-sm font-extrabold text-muted-foreground">Players 1 and 2 are Team A. Players 3 and 4 are Team B.</p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{players.map((p, i) => <Card key={i} className="flex flex-col gap-3 p-4"><span className="flex items-center gap-3"><Face id={p.avatar} size={52} tint={AVATARS.find((a) => a.id === p.avatar)?.tint} /><span className="text-[15px] font-black">{mode === "duo" ? `Team ${i < 2 ? "A" : "B"} · ` : ""}Player {i + 1}</span></span><Field label="Name" maxLength={20} value={i === 0 ? names[mode][0] || p.name : names[mode][i] ?? ""} onChange={(e) => setNames((old) => ({ ...old, [mode]: Object.assign([...old[mode]], { [i]: e.target.value }) }))} />{i > 0 && <div role="radiogroup" aria-label={`Player ${i + 1} look`} className="flex flex-wrap gap-2">{AVATARS.map((a) => <button key={a.id} type="button" role="radio" aria-checked={p.avatar === a.id} aria-label={a.label} onClick={() => setAvatars((old) => Object.assign([...old], { [i]: a.id }))} className={cn("rounded-full", p.avatar === a.id && "ring-3 ring-brand")}><Face id={a.id} size={40} tint={a.tint} /></button>)}</div>}</Card>)}</div>
      <Card className="flex flex-col gap-3 p-4"><span className="text-[15px] font-black">Questions</span><Segmented label="Number of questions" value={count} onChange={setCount} options={[{ value: "3", label: "3" }, { value: "5", label: "5" }, { value: "8", label: "8" }]} /><span className="text-[13px] font-bold text-muted-foreground">Multiple choice and true or false. No timer. Answers stay hidden until everyone is done.</span></Card>
      {error && <Notice onClose={() => setError(null)}>{error}</Notice>}<Button variant="brand" size="cta" onClick={start}><Swords /> Start the quiz</Button>
    </>}
  </Page>;

  if (phase === "creating") return <Page className="max-w-[720px]"><Working title="Setting up the quiz…" steps={["Reading the lesson", "Writing questions", "Checking the answers"]} /></Page>;
  if (phase === "scoring") return <Page className="max-w-[720px]"><Working title="Checking everyone’s answers…" /></Page>;
  if (!quiz) return null;
  const player = players[turn];
  if (phase === "handoff") return <Page className="max-w-[720px]"><Stage className="flex h-[300px] items-end justify-center md:h-[360px]"><div className="absolute bottom-5 left-1/2 h-6 w-[200px] -translate-x-1/2 rounded-[50%] bg-stage-floor" /><Sprite id={player.avatar} className="relative bottom-5 w-[240px] md:w-[300px]" alt={player.name} /></Stage><Card className="flex flex-col items-center gap-2 p-5 text-center"><span className="flex items-center gap-2 text-[13px] font-black tracking-[.04em] text-muted-foreground"><EyeOff className="size-4" /> EVERYONE ELSE, LOOK AWAY</span><span className="text-[24px] font-black">{turn === 0 ? `${player.name} goes first` : `Pass the phone to ${player.name}`}</span><span className="text-[15px] font-bold text-muted-foreground">{quiz.questions.length} questions on {lessonTitle}. Answers appear after everyone finishes.</span></Card><Button variant="brand" size="cta" onClick={() => setPhase("answer")}>I’m {player.name}, start</Button></Page>;
  if (phase === "answer") {
    const q = quiz.questions[qi];
    return <Page className="max-w-[860px]"><div className="flex items-center gap-3"><Face id={player.avatar} size={44} tint={AVATARS.find((a) => a.id === player.avatar)?.tint} /><span className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-sm font-black">{player.name}’s turn · {qi + 1} of {quiz.questions.length}</span><ProgressBar value={(qi / quiz.questions.length) * 100} className="h-2.5" /></span></div><Card className="flex flex-col gap-2 p-4 md:p-6"><span className="text-xs font-black tracking-[.06em] text-brand-ink uppercase">{q.type === "true_false" ? "True or false" : "Question"}</span><h1 className="text-[20px] leading-snug font-black md:text-[24px]">{q.question}</h1>{q.visual_html && <VisualFrame html={q.visual_html} title="Question diagram" />}</Card><div className={cn("grid gap-2.5", q.options.length === 2 ? "grid-cols-2" : "md:grid-cols-2")}>{q.options.map((option, i) => <button key={i} type="button" onClick={() => answer(i)} className="flex min-h-[60px] items-center gap-3 rounded-2xl border border-line bg-card p-3 text-left text-[16px] font-extrabold shadow-[0_3px_0_#dde5ea] hover:bg-muted"><span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2f4] text-sm font-black">{q.type === "true_false" ? (i === 0 ? "T" : "F") : "ABCDEFGH"[i]}</span>{option}</button>)}</div>{error && <><Notice onClose={() => setError(null)}>{error}</Notice><Button variant="soft" size="cta" onClick={() => score(sheets)}>Retry checking answers</Button></>}<p className="text-center text-[13px] font-bold text-muted-foreground">Your answer stays hidden until everyone finishes.</p></Page>;
  }
  if (!grades) return null;
  const scores = players.map((_, i) => grades.reduce((sum, grade, q) => sum + Number(sheets[i][q] === grade.answer_index), 0));
  const teamA = scores[0] + scores[1];
  const teamB = (scores[2] ?? 0) + (scores[3] ?? 0);
  const max = Math.max(...scores);
  const headline = mode === "duo" ? teamA === teamB ? "It’s a draw!" : `Team ${teamA > teamB ? "A" : "B"} wins!` : scores.filter((s) => s === max).length > 1 ? "It’s a draw!" : `${players[scores.indexOf(max)].name} wins!`;
  return <Page className="max-w-[960px]"><Stage className="h-[280px] md:h-[320px]"><span className="absolute inset-x-0 top-5 text-center text-[26px] font-black md:text-[30px]">{headline}</span><span className="absolute inset-x-0 top-[62px] text-center text-[15px] font-extrabold text-[#3f6470]">{mode === "duo" ? `Team A ${teamA} · Team B ${teamB}` : players.map((p, i) => `${p.name} ${scores[i]}`).join(" · ")} · out of {quiz.questions.length} each</span><div className="absolute bottom-4 left-1/2 h-6 w-[280px] -translate-x-1/2 rounded-[50%] bg-stage-floor" /><Sprite id={players[0].avatar} className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[88%] md:w-[230px]" alt={players[0].name} /><Sprite id={players[1].avatar} flip className="absolute bottom-4 left-1/2 w-[200px] -translate-x-[12%] md:w-[230px]" alt={players[1].name} /></Stage><Card className="flex items-center gap-3 p-4"><Coin size={28} /><span className="flex-1 text-[15px] font-extrabold">{players[0].name} earned <b>+{scores[0] * 10 + 20} coins</b> ({scores[0]} right + 20 for playing together)</span></Card>{mode !== "family" && <Card className="grid gap-2 p-4 sm:grid-cols-2">{players.map((p, i) => <span key={i} className="text-sm font-extrabold">{mode === "duo" ? `Team ${i < 2 ? "A" : "B"} · ` : ""}{p.name}: {scores[i]}/{quiz.questions.length}</span>)}</Card>}<ol className="flex flex-col gap-3">{quiz.questions.map((q, i) => <li key={q.index}><Card className="flex flex-col gap-2.5 p-4"><span className="text-[16px] font-black">{i + 1}. {q.question}</span><span className="text-sm font-extrabold text-brand-dark">Answer: {q.options[grades[i].answer_index]}</span>{grades[i].answer_visual_html && <VisualFrame html={grades[i].answer_visual_html!} title="Completed diagram" />}<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{players.map((p, j) => { const correct = sheets[j][i] === grades[i].answer_index; return <span key={j} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold", correct ? "bg-brand-soft" : "bg-[#fdecec]")}>{correct ? <Check className="size-4 text-brand" strokeWidth={3} /> : <X className="size-4 text-[#d24d4d]" strokeWidth={3} />}{p.name}: {q.options[sheets[j][i]]}</span>; })}</div><span className="text-sm leading-relaxed font-bold text-muted-foreground">{grades[i].explanation}</span></Card></li>)}</ol><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"><Button variant="brand" size="cta" onClick={() => setPhase("setup")}>New quiz</Button><Link href={`/learn/lesson/${lessonId}`} className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>Back to the lesson</Link></div></Page>;
}
