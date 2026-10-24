"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, RotateCw, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Sprite } from "@/components/qn/sprite";
import { VisualFrame } from "@/components/qn/visual-frame";
import { Card, Notice, PageHeader, ProgressBar, Spinner } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type DeckState, type PublicDeck, learnApi } from "@/lib/learn-api";
import { bump, markStudiedToday } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Flashcards with the server-side review loop: `know` retires a card, `again` brings it back later. */
export function DeckScreen({ id }: { id: string }) {
  const [deck, setDeck] = useState<PublicDeck | null>(null);
  const [state, setDeckState] = useState<DeckState | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [sending, setSending] = useState<null | "know" | "again">(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    learnApi
      .getDeck(id)
      .then((d) => {
        setDeck(d);
        setDeckState(d.state);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Couldn’t load the flashcards."));
  }, [id]);

  async function review(result: "know" | "again") {
    if (!deck || !state || state.next === null) return;
    setSending(result);
    setError(null);
    try {
      const s = await learnApi.review(deck.id, state.next, result);
      setDeckState(s);
      setFlipped(false);
      bump(["d-cards"]);
      markStudiedToday();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t save that. Try again.");
    } finally {
      setSending(null);
    }
  }

  if (loadError)
    return (
      <Page className="max-w-[760px]">
        <PageHeader title="Flashcards" back={{ href: "/learn", label: "Back to Learn" }} />
        <Notice>{loadError}</Notice>
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
      </Page>
    );
  }

  const card = deck.cards.find((c) => c.index === state.next)!;
  const visual = flipped ? card.back_visual_html : card.front_visual_html;
  return (
    <Page className="max-w-[760px]">
      <div className="flex items-center gap-3">
        <Link href={back} aria-label="Close flashcards" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card hover:bg-muted">
          <X className="size-5" strokeWidth={2.6} />
        </Link>
        <ProgressBar value={(state.known / state.total) * 100} className="h-3 flex-1" />
        <span className="text-sm font-black whitespace-nowrap">
          {state.known}/{state.total} known
        </span>
      </div>
      <span className="text-sm font-extrabold text-muted-foreground">{deck.title}</span>

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
        <span className="mb-6 rounded-[14px_14px_14px_4px] border border-line bg-card px-3 py-2 text-sm font-extrabold">Say it out loud before you flip!</span>
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
    </Page>
  );
}
