"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, FileText, Search, Sparkles, Trash2 } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { LearnSteps, useLearnerAge } from "@/components/qn/learn-bits";
import { Card, Field, Notice, PageHeader, Spinner, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { ApiError, type FoundPages, type MaterialInfo, learnApi } from "@/lib/learn-api";
import { bump, forget, markStudiedToday, remember } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Step 2: confirm what was read from the upload and choose the part to study. */
export function MaterialScreen({ id }: { id: string }) {
  const router = useRouter();
  const [m, setM] = useState<MaterialInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [found, setFound] = useState<FoundPages | null>(null);
  const [finding, setFinding] = useState(false);
  const [making, setMaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { age } = useLearnerAge();

  // Cache Components keeps this page alive (hidden) after we open the lesson; clear the
  // "writing" screen when it hides so coming back shows the page again.
  useLayoutEffect(() => () => setMaking(false), []);

  useEffect(() => {
    learnApi
      .getMaterial(id)
      .then(setM)
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Couldn’t load the upload."));
  }, [id]);

  async function preview(t = topic) {
    const q = t.trim();
    if (!q) return setError("Type a topic, a chapter (chapter 3) or pages (pages 4-9).");
    setError(null);
    setFinding(true);
    setFound(null);
    try {
      setFound(await learnApi.findPages(id, q));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t search the pages.");
    } finally {
      setFinding(false);
    }
  }

  async function make() {
    const q = topic.trim();
    if (!q) return setError("Choose what to study first.");
    if (!age) return setError("We don’t know your age yet, so we can’t pitch the lesson right. Add it once in Settings.");
    setError(null);
    setMaking(true);
    try {
      await learnApi.ensureConfirmed(id);
      const lesson = await learnApi.createLesson({ topic: q, age, material_id: id });
      remember({ kind: "lesson", id: lesson.id, title: lesson.title, detail: lesson.source ? `From ${lesson.source.title} · ${lesson.source.label}` : lesson.summary });
      bump(["d-lesson", "w-lessons"]);
      markStudiedToday();
      router.push(`/learn/lesson/${lesson.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t write the lesson. Try again.");
      setMaking(false);
    }
  }

  async function remove() {
    await learnApi.deleteMaterial(id).catch(() => null);
    forget("material", id);
    router.push("/learn/new");
  }

  if (making)
    return (
      <Page className="max-w-[720px]">
        <Working title="Writing your lesson…" steps={["Reading your pages", "Planning the sections", "Writing it for your age", "Adding key points"]} />
      </Page>
    );

  if (loadError)
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Check your notes" back={{ href: "/learn/new", label: "Back" }} />
        <Notice>{loadError}</Notice>
        <Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Upload again
        </Link>
      </Page>
    );

  if (!m)
    return (
      <Page className="max-w-[720px]">
        <div className="flex items-center gap-2.5 p-8 font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand-ink" /> Loading your upload…
        </div>
      </Page>
    );

  return (
    <Page className="max-w-[1080px]">
      <LearnSteps step={2} />
      <PageHeader
        title="Check your notes"
        sub="Make sure we read your pages right, then pick what to study."
        back={{ href: "/learn/new", label: "Back to upload" }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-soft text-sky-ink">
                <FileText className="size-6" strokeWidth={2.2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[17px] font-black">{m.name}</span>
                <span className="text-[13px] font-bold text-muted-foreground">
                  {m.kind === "pdf" ? "PDF" : "Photos"} · {m.page_count} page{m.page_count === 1 ? "" : "s"}
                </span>
              </span>
              <Button variant="ghost" size="round" onClick={remove} aria-label="Remove this upload">
                <Trash2 />
              </Button>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Read directly", m.text_pages],
                ["Read by AI", m.vision_pages],
                ["Blank", m.blank_pages],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-2xl bg-background px-2 py-2.5">
                  <dt className="text-xs font-extrabold text-muted-foreground">{k}</dt>
                  <dd className="text-[20px] font-black">{v}</dd>
                </div>
              ))}
            </dl>
            {m.warnings.map((w) => (
              <Notice key={w} tone="warn">
                {w}
              </Notice>
            ))}
          </Card>

          {m.chapters.length > 0 && (
            <Card className="flex flex-col gap-2.5 p-4">
              <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">CHAPTERS FOUND</span>
              <ul className="flex flex-col gap-2">
                {m.chapters.map((c, i) => {
                  // The service matches the book's own heading word + number ("Chapter 3", "Unit II").
                  const q = c.title.split(":")[0].trim();
                  const num = q.split(/\s+/)[1] ?? String(i + 1);
                  const on = topic === q;
                  return (
                    <li key={`${c.title}-${i}`}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setTopic(q);
                          preview(q);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left",
                          on ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted",
                        )}
                      >
                        <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg bg-night px-1.5 text-sm font-black text-white">{num}</span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold">{c.title}</span>
                        <span className="text-[13px] font-bold whitespace-nowrap text-muted-foreground">
                          p. {c.start}–{c.end}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {found && (
            <Card className="flex flex-col gap-2.5 border-brand p-4">
              <span className="flex items-center gap-2 text-[15px] font-black text-brand-dark">
                <BookOpenCheck className="size-5" /> {found.label}
              </span>
              <span className="text-[13px] font-bold text-muted-foreground">
                Pages {found.pages.slice(0, 12).join(", ")}
                {found.pages.length > 12 ? "…" : ""} · {found.characters.toLocaleString("en-US")} characters
                {found.truncated ? " · long, so the lesson uses the first part" : ""}
              </span>
              <p className="max-h-[200px] overflow-y-auto rounded-2xl bg-background p-3 text-sm leading-relaxed font-semibold whitespace-pre-line">{found.preview}</p>
              <span className="text-[13px] font-bold text-muted-foreground">Does this match your notes? The lesson will only use what these pages say.</span>
            </Card>
          )}
        </div>

        <Card className="flex flex-col gap-4 p-4 lg:sticky lg:top-6">
          <span className="text-[17px] font-black">What do you want to study?</span>
          <Field
            label="Topic, chapter or pages"
            placeholder="e.g. photosynthesis, chapter 2, pages 4-9"
            maxLength={200}
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setFound(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && preview()}
          />
          <Button type="button" variant="soft" size="pill" onClick={() => preview()} disabled={finding}>
            {finding ? <Spinner /> : <Search />} Show which pages
          </Button>
          {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
          <Button type="button" variant="brand" size="cta" onClick={make}>
            <Sparkles /> Make my lesson
          </Button>
        </Card>
      </div>
    </Page>
  );
}
