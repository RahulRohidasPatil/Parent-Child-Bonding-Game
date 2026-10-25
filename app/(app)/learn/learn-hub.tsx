"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, FileText, ListChecks, Plus, Swords, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Card, EmptyState, PageHeader } from "@/components/qn/ui";
import { buttonVariants } from "@/components/ui/button";
import { forget, useQN, type RecentItem } from "@/lib/store";
import { subjectOf } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

const KIND = {
  lesson: { icon: BookOpen, label: "Lesson", href: (r: RecentItem) => `/learn/lesson/${r.id}` },
  quiz: { icon: ListChecks, label: "Quiz", href: (r: RecentItem) => `/play/solo/quiz/${r.id}` },
  material: { icon: FileText, label: "Upload", href: (r: RecentItem) => `/learn/material/${r.id}` },
  duel: { icon: Swords, label: "Duel", href: (r: RecentItem) => (r.lessonId ? `/play/duel?lesson=${r.lessonId}` : "/play/duel") },
} as const;

export function LearnHub() {
  const recent = useQN((s) => s.recent);
  const lessons = recent.filter((r) => r.kind === "lesson");
  const practice = recent.filter((r) => r.kind === "quiz");
  const uploads = recent.filter((r) => r.kind === "material");

  return (
    <Page>
      <PageHeader
        title="Learn"
        sub="Your lessons and quizzes"
        right={
          <Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "pill" }))}>
            <Plus strokeWidth={2.6} /> New lesson
          </Link>
        }
      />

      {lessons.length === 0 ? (
        <EmptyState
          title="No lessons yet"
          action={
            <Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
              Make my first lesson
            </Link>
          }
        >
          Upload photos of your notes or a PDF, or just type a topic. We’ll write a lesson for your age, then quiz you on it.
        </EmptyState>
      ) : (
        <section className="flex flex-col gap-3" aria-labelledby="lessons-h">
          <h2 id="lessons-h" className="text-[17px] font-black">Lessons</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lessons.map((r) => (
              <RecentCard key={r.id} item={r} />
            ))}
          </ul>
        </section>
      )}

      {practice.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="practice-h">
          <h2 id="practice-h" className="text-[17px] font-black">Practice</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {practice.map((r) => (
              <RecentCard key={`${r.kind}-${r.id}`} item={r} />
            ))}
          </ul>
        </section>
      )}

      {uploads.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="uploads-h">
          <h2 id="uploads-h" className="text-[17px] font-black">Uploads</h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {uploads.map((r) => (
              <RecentCard key={r.id} item={r} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-[13px] font-bold text-muted-foreground">
        Lessons and quizzes live on the learning server and disappear when it restarts. This list is kept in this browser.
      </p>
    </Page>
  );
}

function RecentCard({ item }: { item: RecentItem }) {
  const k = KIND[item.kind];
  const s = item.subject ? subjectOf(item.subject) : null;
  const Icon = k.icon;
  return (
    <li>
      <Card className="relative flex items-center gap-3 p-3.5">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: s?.tile ?? "#e2f3eb", color: s?.ink ?? "#226e52" }}>
          <Icon className="size-6" strokeWidth={2.2} />
        </span>
        <Link href={k.href(item)} className="flex min-w-0 flex-1 flex-col leading-tight after:absolute after:inset-0 after:rounded-3xl">
          <span className="text-xs font-black tracking-[.04em] text-muted-foreground uppercase">
            {s ? `${k.label} · ${s.label}` : k.label}
          </span>
          <span className="truncate text-[16px] font-black">{item.title}</span>
          {item.detail && <span className="truncate text-[13px] font-bold text-muted-foreground">{item.detail}</span>}
        </Link>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
        <button
          type="button"
          onClick={() => forget(item.kind, item.id)}
          aria-label={`Remove ${item.title} from this list`}
          className="relative z-10 -mr-1 flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </Card>
    </li>
  );
}
