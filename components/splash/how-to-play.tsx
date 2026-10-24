"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Blob } from "./blob";
import type { AvatarColor } from "@/lib/game/types";

const STEPS: { color: AvatarColor; mood: "happy" | "sus" | "shock"; title: string; body: string }[] = [
  {
    color: "sun",
    mood: "happy",
    title: "Peek at your secret",
    body: "Everyone gets the same secret word… except one sneaky Splashie, the imposter, who only learns the category.",
  },
  {
    color: "coral",
    mood: "sus",
    title: "Give one clue each",
    body: "Take turns saying one word about the secret. Not too obvious, or the imposter will catch on!",
  },
  {
    color: "mint",
    mood: "shock",
    title: "Talk it out & vote",
    body: "Chat about the clues, then everyone votes for who they think the imposter is. Catch them to win the round.",
  },
];

export function HowToPlay({ trigger }: { trigger?: React.ReactElement }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ?? (
            <Button variant="ghost" size="lg" className="rounded-full text-muted-foreground">
              <CircleHelp /> How to play
            </Button>
          )
        }
      />
      <DialogContent className="theme-splash gap-5 rounded-3xl border border-white/10 bg-popover p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-semibold">How to play</DialogTitle>
          <DialogDescription>3+ players, each on their own phone. About 5 minutes a round.</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <Blob color={s.color} mood={s.mood} size={44} />
              <div>
                <p className="font-heading text-lg font-semibold leading-tight">
                  {i + 1}. {s.title}
                </p>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="rounded-2xl bg-white/6 p-3 text-sm">
          <span className="font-bold">Scoring:</span> catch the imposter and everyone else gets 1 point. If the
          imposter escapes, they get 2.
        </p>
      </DialogContent>
    </Dialog>
  );
}
