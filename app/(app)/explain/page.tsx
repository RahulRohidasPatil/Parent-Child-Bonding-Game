"use client";

import { useState } from "react";
import Link from "next/link";
import { BookMarked, Home, MessageCircleQuestion, Quote, Sparkles } from "lucide-react";
import { Segmented } from "@/components/splash/segmented";
import { ReadAloudButton } from "@/components/kay/read-aloud";
import { Eyebrow, Page, Panel } from "@/components/kay/ui";
import { BLOCKS, EXPLANATIONS } from "@/lib/kay/content";
import { useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

type Age = "young" | "middle" | "older";
const CONCEPTS = BLOCKS.flatMap((b) => b.concepts.map((c) => ({ ...c, block: b })));

export default function Explain() {
  const { partner } = useSession();
  const child = partner?.role === "kid" ? partner.name : "your child";
  const [conceptId, setConceptId] = useState(CONCEPTS[0].id);
  const [age, setAge] = useState<Age>("middle");
  const concept = CONCEPTS.find((c) => c.id === conceptId)!;
  const e = EXPLANATIONS[conceptId];

  return (
    <Page back="/home" title="Explain it">
      <p className="text-muted-foreground">
        Pick an idea from this week and Kay suggests a way to explain it to {child}.
      </p>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">
          <Eyebrow>Idea</Eyebrow>
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONCEPTS.map((c) => (
            <label
              key={c.id}
              className={cn(
                "cursor-pointer rounded-full border-2 bg-card px-3 py-1.5 text-sm font-bold transition",
                "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                conceptId === c.id && "border-primary bg-primary text-primary-foreground",
              )}
            >
              <input type="radio" name="concept" className="sr-only" checked={conceptId === c.id} onChange={() => setConceptId(c.id)} />
              <span aria-hidden>{c.block.emoji}</span> {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Eyebrow>Their age</Eyebrow>
        <Segmented<Age>
          name="age"
          value={age}
          onChange={setAge}
          options={[
            { value: "young", label: "5–7" },
            { value: "middle", label: "8–10" },
            { value: "older", label: "11+" },
          ]}
        />
      </div>

      <div key={`${conceptId}-${age}`} className="flex flex-col gap-3 animate-rise" aria-live="polite">
        <Panel className="border-grape/40 bg-grape/12">
          <div className="flex items-start justify-between gap-2">
            <Eyebrow className="flex items-center gap-1">
              <Quote className="size-3.5" aria-hidden /> Try saying
            </Eyebrow>
            <ReadAloudButton text={e.sayThis[age]} label="Listen" />
          </div>
          <p className="mt-2 text-balance font-heading text-2xl font-semibold leading-snug">“{e.sayThis[age]}”</p>
        </Panel>

        <Panel className="flex gap-3">
          <Sparkles className="size-6 shrink-0 text-sun" aria-hidden />
          <div>
            <Eyebrow>It&apos;s like…</Eyebrow>
            <p className="mt-1">{e.analogy}</p>
          </div>
        </Panel>
        <Panel className="flex gap-3">
          <MessageCircleQuestion className="size-6 shrink-0 text-sky" aria-hidden />
          <div>
            <Eyebrow>Ask them</Eyebrow>
            <p className="mt-1">{e.askThem}</p>
          </div>
        </Panel>
        <Panel className="flex gap-3">
          <Home className="size-6 shrink-0 text-coral" aria-hidden />
          <div>
            <Eyebrow>Try at home · 5 min</Eyebrow>
            <p className="mt-1">{e.tryAtHome}</p>
          </div>
        </Panel>

        <Link
          href={`/learn/${concept.block.id}`}
          className="inline-flex items-center gap-1.5 self-start text-sm font-bold text-primary underline-offset-4 hover:underline"
        >
          <BookMarked className="size-4" aria-hidden /> Based on the lesson “{concept.block.title}”
        </Link>
      </div>

      <Panel className="border-dashed bg-transparent shadow-none">
        <Eyebrow>Coming soon</Eyebrow>
        <p className="mt-1 font-bold">Explain something you know</p>
        <p className="text-sm text-muted-foreground">
          Type an idea from your own work (say, how a bridge holds weight) and Kay will help you turn it into a
          kid-sized explanation.
        </p>
      </Panel>
    </Page>
  );
}
