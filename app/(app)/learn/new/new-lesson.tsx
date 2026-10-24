"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Camera, FileText, ImageIcon, Sparkles, Upload, X, Zap } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { LearnSteps, useLearnerAge } from "@/components/qn/learn-bits";
import { Card, Notice, PageHeader, Pill, Working } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { ApiError, learnApi } from "@/lib/learn-api";
import { bump, markStudiedToday, remember } from "@/lib/store";
import { cn } from "@/lib/utils";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_FILE = 25 * 1024 * 1024;
const MAX_PROMPT = 200; // the lesson API's topic limit

type NoteType = "quick" | "plan";

/** Same files in the same order → same upload, so a retry doesn't upload them again. */
const filesKey = (files: File[]) => files.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");

export function NewLesson() {
  const router = useRouter();
  const promptId = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("quick");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<null | "upload" | "lesson">(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [uploaded, setUploaded] = useState<{ key: string; id: string } | null>(null);
  const { age, loading: ageLoading } = useLearnerAge();
  const pick = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const hasFiles = files.length > 0;

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !ACCEPT.split(",").includes(f.type));
    if (bad) return setError(`“${bad.name}” can’t be read. Use a PDF, or JPG, PNG or WebP photos.`);
    const big = incoming.find((f) => f.size > MAX_FILE);
    if (big) return setError(`“${big.name}” is over 25 MB.`);
    const next = [...files, ...incoming];
    const pdfs = next.filter((f) => f.type === "application/pdf");
    if (pdfs.length && next.length > 1) return setError("Upload one PDF on its own, or up to 20 photos.");
    if (next.length > 20) return setError("Up to 20 photos at once.");
    setFiles(next);
  }

  async function submit() {
    setTried(true);
    const topic = prompt.trim();
    if (!topic) return setError(hasFiles ? "Type which part of your notes to explain." : "Type what you want explained.");
    if (!age) return setError("We don’t know your age yet, so we can’t pitch the notes right. Add it once in Settings.");
    setError(null);
    try {
      let materialId: string | null = null;
      if (hasFiles) {
        const key = filesKey(files);
        if (uploaded?.key === key) {
          materialId = uploaded.id;
        } else {
          setBusy("upload");
          const m = await learnApi.uploadMaterial(files);
          remember({ kind: "material", id: m.id, title: m.name, detail: `${m.page_count} page${m.page_count === 1 ? "" : "s"}` });
          bump(["w-upload"]);
          setUploaded({ key, id: m.id });
          materialId = m.id;
        }
      }
      setBusy("lesson");
      const lesson = await learnApi.createLesson(materialId ? { topic, age, material_id: materialId } : { topic, age });
      remember({ kind: "lesson", id: lesson.id, title: lesson.title, detail: lesson.source ? `From ${lesson.source.title} · ${lesson.source.label}` : lesson.summary });
      bump(["d-lesson", "w-lessons"]);
      markStudiedToday();
      router.push(`/learn/lesson/${lesson.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t make your notes. Try again.");
      setBusy(null);
    }
  }

  if (busy)
    return (
      <Page className="max-w-[720px]">
        <Working
          title={busy === "upload" ? "Reading your pages…" : "Writing your notes…"}
          steps={
            busy === "upload"
              ? ["Uploading", "Reading the text", "Finding chapters", "Almost there"]
              : hasFiles
                ? ["Finding your topic in the pages", "Planning the sections", "Writing it for your age", "Planning the diagrams"]
                : ["Reading your question", "Planning the sections", "Writing it for your age", "Planning the diagrams"]
          }
        />
      </Page>
    );

  const promptError = tried && !prompt.trim() ? (hasFiles ? "Type which part of your notes to explain." : "Type what you want explained.") : undefined;

  return (
    <Page className="max-w-[920px]">
      <LearnSteps step={1} />
      <PageHeader title="What are we learning?" sub="Add your notes if you have them, tell us the topic, and pick the kind of notes." />

      <Card className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-black">Your notes</span>
          <span className="text-xs font-bold text-muted-foreground">Optional</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex min-h-[180px] flex-col items-center justify-center gap-2.5 rounded-3xl border-2 border-dashed p-5 text-center transition-colors",
              drag ? "border-brand bg-brand-soft" : "border-[#9fd8c3] bg-[#f4fbf8]",
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-brand text-white">
              <Upload className="size-5" strokeWidth={2.2} />
            </span>
            <span className="text-[16px] font-black">Drop your notes here</span>
            <span className="text-sm font-bold text-muted-foreground">One PDF, or up to 20 photos of pages (JPG, PNG, WebP) · 25 MB per file</span>
            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
              <Button type="button" variant="soft" size="pill" onClick={() => pick.current?.click()}>
                <ImageIcon /> Choose files
              </Button>
              <Button type="button" variant="soft" size="pill" onClick={() => camera.current?.click()} className="md:hidden">
                <Camera /> Take photo
              </Button>
            </div>
            <input ref={pick} type="file" accept={ACCEPT} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => addFiles(e.target.files)} />
            <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => addFiles(e.target.files)} />
          </div>

          <div className={cn("flex-col gap-2.5 rounded-2xl bg-background p-3", hasFiles ? "flex" : "hidden md:flex")}>
            <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">PAGES ({files.length})</span>
            {files.length === 0 ? (
              <span className="text-sm font-bold text-muted-foreground">Nothing added. Skip this to get notes on any topic.</span>
            ) : (
              <ul className="flex max-h-[180px] flex-col gap-2 overflow-y-auto">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 rounded-xl bg-card px-2.5 py-2">
                    <FileText className="size-[18px] shrink-0 text-brand" />
                    <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{f.name}</span>
                    <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded-full p-1 hover:bg-muted">
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <span className="mt-auto text-[13px] font-bold text-muted-foreground">Text PDFs are read for free. Photos are read by AI. Only use your own copy of a book.</span>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={promptId} className="text-[13px] font-extrabold text-muted-foreground">
              {hasFiles ? "Which part of your notes?" : "What do you want explained?"}
            </label>
            <span className="text-xs font-bold text-muted-foreground" aria-live="polite">
              {prompt.length}/{MAX_PROMPT}
            </span>
          </div>
          <textarea
            id={promptId}
            rows={4}
            maxLength={MAX_PROMPT}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={hasFiles ? "e.g. Photosynthesis, chapter 3, or pages 40-55" : "e.g. How does photosynthesis work?"}
            aria-invalid={promptError ? true : undefined}
            aria-describedby={`${promptId}-hint`}
            className={cn(
              "min-h-[120px] w-full resize-y rounded-2xl border-[1.5px] bg-field px-3.5 py-3 text-base leading-relaxed font-bold text-foreground outline-none placeholder:font-semibold placeholder:text-[#7b8994] focus-visible:border-brand",
              promptError ? "border-destructive" : "border-input",
            )}
          />
          {promptError ? (
            <span id={`${promptId}-hint`} className="text-[13px] font-extrabold text-destructive">
              {promptError}
            </span>
          ) : (
            <span id={`${promptId}-hint`} className="text-[13px] font-bold text-muted-foreground">
              {hasFiles ? "A topic, a chapter or a page range from your notes." : "Any topic or question."}{" "}
              {age ? `Written for age ${age}, with diagrams.` : "Written for your age, with diagrams."}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span id={`${promptId}-type`} className="text-[13px] font-extrabold text-muted-foreground">
            What type of notes?
          </span>
          <div role="radiogroup" aria-labelledby={`${promptId}-type`} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              role="radio"
              aria-checked={noteType === "quick"}
              onClick={() => setNoteType("quick")}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left",
                noteType === "quick" ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white" aria-hidden="true">
                <Zap className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-[15px] font-black">Quick note</span>
                <span className="text-[13px] font-bold text-muted-foreground">An explanation with diagrams, then flashcards or a quiz</span>
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={false}
              aria-disabled="true"
              disabled
              className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-left opacity-60"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground" aria-hidden="true">
                <CalendarDays className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="text-[15px] font-black">Study plan</span>
                <span className="text-[13px] font-bold text-muted-foreground">A day-by-day plan to learn it all</span>
              </span>
              <Pill className="h-7 shrink-0 bg-warn px-2.5 text-xs text-warn-ink">Coming soon</Pill>
            </button>
          </div>
        </div>

        {!ageLoading && !age && (
          <Notice tone="warn">
            We don’t know your age yet.{" "}
            <Link href="/settings" className="font-black underline">
              Add it once in Settings
            </Link>{" "}
            and every explanation will match your level.
          </Notice>
        )}
        <Button type="button" variant="brand" size="cta" onClick={submit}>
          <Sparkles /> {hasFiles ? "Make my notes" : "Explain it to me"}
        </Button>
      </Card>

      {error && (
        <Notice onClose={() => setError(null)}>
          {error}
          {error.includes("don’t know your age") && (
            <>
              {" "}
              <Link href="/settings" className="font-black underline">
                Add your age in Settings
              </Link>
            </>
          )}
        </Notice>
      )}
    </Page>
  );
}
