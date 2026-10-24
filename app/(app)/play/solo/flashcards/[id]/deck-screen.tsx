"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flame, PartyPopper, RotateCw, Volume2, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Sprite } from "@/components/qn/sprite";
import { VisualFrame } from "@/components/qn/visual-frame";
import { Card, Notice, PageHeader, ProgressBar, Spinner } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type DeckState, type PublicDeck, learnApi } from "@/lib/learn-api";
import { bump, markStudiedToday } from "@/lib/store";
import { cn } from "@/lib/utils";

type CachedDeck = { deck: PublicDeck; state: DeckState };
const cacheKey = (id: string) => `qn.flashcards.${id}`;
function readCachedDeck(id: string): CachedDeck | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(cacheKey(id)) || "null") as CachedDeck | null;
    return value?.deck && value.state ? value : null;
  } catch {
    return null;
  }
}
function writeCachedDeck(deck: PublicDeck, state: DeckState) {
  try {
    localStorage.setItem(cacheKey(deck.id), JSON.stringify({ deck, state } satisfies CachedDeck));
  } catch {
    /* best effort */
  }
}

/** Flashcards with the server-side review loop: `know` retires a card, `again` brings it back later. */
export function DeckScreen({ id }: { id: string }) {
  const [deck, setDeck] = useState<PublicDeck | null>(null);
  const [state, setDeckState] = useState<DeckState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [sending, setSending] = useState<null | "know" | "again">(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [localOnly, setLocalOnly] = useState(false);

  const loadDeck = useCallback(() => {
    const cached = readCachedDeck(id);
    if (cached) {
      setDeck(cached.deck);
      setDeckState(cached.state);
      setLocalOnly(true);
      return;
    }
    learnApi
      .getDeck(id)
      .then((d) => {
        setDeck(d);
        setDeckState(d.state);
        writeCachedDeck(d, d.state);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Couldn’t load the flashcards."));
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(loadDeck, 0);
    return () => window.clearTimeout(timer);
  }, [loadDeck]);

  function retryLoad() {
    setLoadError(null);
    loadDeck();
  }

  async function review(result: "know" | "again") {
    if (!deck || !state || state.next === null) return;
    setSending(result);
    setError(null);
    try {
      const s = localOnly
        ? {
            next: result === "know" && state.known + 1 >= state.total ? null : (state.next + 1) % state.total,
            known: result === "know" ? state.known + 1 : state.known,
            total: state.total,
            reviews: state.reviews + 1,
            hard: result === "again" && !state.hard.includes(state.next) ? [...state.hard, state.next] : state.hard,
          }
        : await learnApi.review(deck.id, state.next, result);
      setDeckState(s);
      writeCachedDeck(deck, s);
      setFlipped(false);
      setStreak((current) => (result === "know" ? current + 1 : 0));
      bump(["d-cards"]);
      markStudiedToday();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t save that. Try again.");
    } finally {
      setSending(null);
    }
  }

  async function restart() {
    if (!deck) return;
    const reset: DeckState = { next: deck.cards[0]?.index ?? null, known: 0, total: deck.cards.length, reviews: 0, hard: [] };
    setLocalOnly(true);
    setDeckState(reset);
    setFlipped(false);
    setStreak(0);
    writeCachedDeck(deck, reset);
  }

  if (loadError)
    return (
      <Page className="max-w-[760px]">
        <PageHeader title="Flashcards" back={{ href: "/learn", label: "Back to Learn" }} />
        <Notice>{loadError}</Notice>
        <Button variant="brand" size="cta" onClick={retryLoad}>
          Try again
        </Button>
      </Page>
    );
  if (!deck || !state)
    return (
      <Page className="max-w-[760px]">
        <div className="flex items-center gap-2.5 p-8 font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand" /> Loading the cards…
        </div>
      </Page>
    );

  const back = `/learn/lesson/${deck.lesson_id}`;

  if (state.next === null) {
    const hard = state.hard.map((i) => deck.cards.find((c) => c.index === i)).filter(Boolean);
    return (
      <Page className="max-w-[760px]">
        <PageHeader title="Deck done!" sub={deck.title} back={{ href: back, label: "Back to the lesson" }} />
        <Card className="flex flex-col items-center gap-2 p-6 text-center">
          <PartyPopper className="size-10 text-brand" />
          <span className="text-[22px] font-black">
            You know all {state.total} cards
          </span>
          <span className="text-[15px] font-bold text-muted-foreground">{state.reviews} reviews in total.</span>
        </Card>
        {hard.length > 0 && (
          <Card className="flex flex-col gap-2 p-4">
            <span className="text-[15px] font-black">Cards that took a few tries</span>
            <ul className="flex flex-col gap-1.5">
              {hard.map((c) => (
                <li key={c!.index} className="text-[15px] font-bold">
                  · {c!.front}
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Link href={back} className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Back to the lesson
        </Link>
        <Button variant="outline" size="cta" onClick={restart}>Restart flashcards</Button>
      </Page>
    );
  }

  const card = deck.cards.find((c) => c.index === state.next)!;
  const visual = flipped ? card.back_visual_html : card.front_visual_html;
  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(flipped ? card.back : card.front));
  };
  const explain = () => setError("Ask Mom to explain this card in your own words, then flip it to check.");
  return (
    <Page className="max-w-[760px] md:max-w-[620px]">
      <div className="flex items-center gap-3">
        <Link href={back} aria-label="Close flashcards" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card hover:bg-muted">
          <X className="size-5" strokeWidth={2.6} />
        </Link>
        <ProgressBar value={(state.known / state.total) * 100} className="h-3 flex-1" />
        <span className="flex h-8 items-center gap-1 rounded-full bg-flame px-2.5 text-sm font-black text-flame-ink whitespace-nowrap" aria-label={`${streak} card streak`}>
          <Flame className="size-4 fill-flame-ink text-flame-ink" /> {streak}
        </span>
        <Button variant="outline" size="sm" onClick={restart}>Restart</Button>
      </div>
      <span className="text-sm font-extrabold text-muted-foreground">{deck.title} · card {Math.min(state.known + 1, state.total)} of {state.total}</span>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Show the question side" : "Show the answer"}
        className={cn(
          "flex min-h-[320px] flex-col items-center justify-between gap-4 rounded-[28px] p-5 text-center md:min-h-[380px] md:p-8",
          flipped ? "bg-[#f7fbff] shadow-[0_6px_0_#cfe0f2,0_14px_30px_rgba(31,45,58,.08)]" : "bg-card shadow-[0_6px_0_#dde5ea,0_14px_30px_rgba(31,45,58,.08)]",
        )}
      >
        <span className={cn("rounded-full px-3 py-1 text-[13px] font-black", flipped ? "bg-sky-soft text-sky-ink" : "bg-brand-soft text-brand-dark")}>
          {flipped ? "Answer" : card.kind === "diagram" ? "Diagram" : "Question"}
        </span>
        <span className={cn("leading-snug font-black whitespace-pre-line", flipped ? "text-[20px] font-extrabold md:text-[23px]" : "text-[26px] md:text-[34px]")}>
          {flipped ? card.back : card.front}
        </span>
        <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-muted-foreground">
          <RotateCw className="size-4" /> Tap the card to flip
        </span>
      </button>
      {visual && <VisualFrame html={visual} title="Card diagram" />}

      <div className="flex items-end gap-2">
        <Sprite id="cat" className="w-12" />
        <span className="mb-6 rounded-[14px_14px_14px_4px] border border-line bg-card px-3 py-2 text-sm font-extrabold">Say it out loud first!</span>
      </div>

      {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" size="cta" onClick={() => review("again")} disabled={!!sending} className="bg-[#fff0e3] text-flame-ink shadow-[0_4px_0_#f2c9a6] hover:bg-[#ffe6d2]">
          {sending === "again" && <Spinner />} Again
        </Button>
        <Button variant="brand" size="cta" onClick={() => review("know")} disabled={!!sending}>
          {sending === "know" && <Spinner />} Got it
        </Button>
      </div>
      <div className="flex gap-2.5">
        <Button variant="outline" size="lg" onClick={speak} className="flex-1"><Volume2 className="size-4" /> Read aloud</Button>
        <Button variant="outline" size="lg" onClick={explain} className="flex-1">Explain to Mom</Button>
      </div>
      <Link href="/play/duel" className="flex h-12 items-center justify-center rounded-2xl bg-night text-[15px] font-black text-white shadow-[0_4px_0_#18232b]">
        Skip to module quiz
      </Link>
    </Page>
  );
}
