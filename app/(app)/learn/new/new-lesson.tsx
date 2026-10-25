"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, FileText, Sparkles, Upload, X, Zap } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { LearnSteps, useLearnerAge } from "@/components/qn/learn-bits";
import { Card, Notice, PageHeader, Working } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { ApiError, learnApi } from "@/lib/learn-api";
import { bump, markStudiedToday, remember, savePlan } from "@/lib/store";
import { DEFAULT_UPLOAD_PROMPT, parseStudyPlan, planMessage } from "@/lib/study-plan";
import { cn } from "@/lib/utils";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const isPdf = (f: File) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
const isImage = (f: File) => ["image/jpeg", "image/png", "image/webp"].includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
const MAX_FILE = 25 * 1024 * 1024;
const MAX_PROMPT = 200; // the lesson API's topic limit

type NoteType = "quick" | "plan";

/** Same file → same upload, so a retry doesn't upload it again. */
const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;

/**
 * "Explain my notes", "summarise this PDF", "everything"... ask for the whole upload, but the API only
 * understands a topic, "chapter 3" or "pages 40-55", so those become a page range covering every page.
 */
const WHOLE_UPLOAD =
  /^(?:please\s+)?(?:(?:explain|summari[sz]e|teach|cover|go\s+through|study|learn)\b\s*)?(?:me\s+)?(?:(?:from|about|on)\s+)?(?:(?:all|the|my|this|these|that|whole|entire|full|attached|uploaded)\s+)*(?:notes?|pdf|document|doc|file|book|upload|chapter|everything|it|all)?\s*(?:please)?[.!?]*$/i;

/**
 * The part of the upload to study. A prompt the API can't place in the pages ("explain", "what is
 * this about", "explain the content") studies the whole upload instead of failing; the find check is free.
 */
async function topicFor(prompt: string, material: { id: string; pages: number }) {
  const whole = `pages 1-${material.pages}`;
  if (WHOLE_UPLOAD.test(prompt)) return whole;
  try {
    await learnApi.findPages(material.id, prompt);
    return prompt;
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return whole;
    throw e;
  }
}

export function NewLesson() {
  const router = useRouter();
  const promptId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("quick");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState<null | "upload" | "lesson" | "plan">(null);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [uploaded, setUploaded] = useState<{ key: string; id: string; pages: number } | null>(null);
  const { age, loading: ageLoading } = useLearnerAge();
  const pick = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  const hasFiles = file !== null;

  // Cache Components keeps this page alive (hidden) after we navigate to the lesson, so without this
  // the "Writing your notes…" screen would still be showing on the way back. Reset when hidden; after a
  // finished lesson, also start with an empty form so the next upload is fresh.
  useLayoutEffect(() => {
    const input = pick.current;
    return () => {
      setBusy(null);
      if (!finished.current) return;
      finished.current = false;
      setFile(null);
      setPrompt("");
      setUploaded(null);
      setTried(false);
      setError(null);
      if (input) input.value = "";
    };
  }, []);

  function addFile(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    if (list.length > 1) return setError("Add one file at a time: a PDF or a photo.");
    const f = list[0];
    if (!isPdf(f) && !isImage(f)) return setError(`“${f.name}” can’t be read. Use a PDF, or a JPG, PNG or WebP photo.`);
    if (f.size > MAX_FILE) return setError(`“${f.name}” is over 25 MB.`);
    setFile(f);
  }

  async function submit() {
    setTried(true);
    // With a file the prompt is optional: an empty box explains the whole upload.
    const topic = prompt.trim() || (hasFiles ? DEFAULT_UPLOAD_PROMPT : "");
    if (!topic) return setError(noteType === "plan" ? "Type what the study plan should cover." : "Type what you want explained.");
    if (!age) return setError("We don’t know your age yet, so we can’t pitch the notes right. Add it once in Settings.");
    setError(null);
    try {
      let material: { id: string; pages: number } | null = null;
      if (file) {
        const key = fileKey(file);
        if (uploaded?.key === key) {
          material = uploaded;
        } else {
          setBusy("upload");
          const m = await learnApi.uploadMaterial([file]);
          remember({ kind: "material", id: m.id, title: m.name, detail: `${m.page_count} page${m.page_count === 1 ? "" : "s"}` });
          bump(["w-upload"]);
          material = { id: m.id, pages: m.page_count };
          setUploaded({ key, ...material });
        }
        // The API only builds lessons from an upload whose extracted text has been confirmed.
        await learnApi.ensureConfirmed(material.id);
      }
      if (noteType === "plan") {
        setBusy("plan");
        const out = await learnApi.chat({
          message: planMessage(topic),
          age,
          ...(material ? { material_id: material.id, mode: "pdf_only" as const } : {}),
        });
        const id = crypto.randomUUID();
        savePlan({ id, ...parseStudyPlan(out.answer, file?.name ?? topic), prompt: topic, source: out.used_pdf ? out.label : null, material, at: Date.now() });
        bump(["d-lesson", "w-lessons"]);
        markStudiedToday();
        finished.current = true;
        router.push(`/learn#plan-${id}`);
        return;
      }
      setBusy("lesson");
      const lesson = await learnApi.createLesson(
        material ? { topic: await topicFor(topic, material), age, material_id: material.id } : { topic, age },
      );
      remember({ kind: "lesson", id: lesson.id, title: lesson.title, detail: lesson.source ? `From ${lesson.source.title} · ${lesson.source.label}` : lesson.summary });
      bump(["d-lesson", "w-lessons"]);
      markStudiedToday();
      finished.current = true;
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
          title={busy === "upload" ? "Reading your pages…" : busy === "plan" ? "Building your study plan…" : "Writing your notes…"}
          steps={
            busy === "upload"
              ? ["Uploading", "Reading the text", "Finding chapters", "Almost there"]
              : busy === "plan"
                ? ["Finding the main topic", "Splitting it into subtopics", "Explaining each one", "Drawing the diagrams"]
                : hasFiles
                ? ["Finding your topic in the pages", "Planning the sections", "Writing it for your age", "Planning the diagrams"]
                : ["Reading your question", "Planning the sections", "Writing it for your age", "Planning the diagrams"]
          }
        />
      </Page>
    );

  const promptError = tried && !prompt.trim() && !hasFiles ? (noteType === "plan" ? "Type what the study plan should cover." : "Type what you want explained.") : undefined;

  return (
    <Page className="max-w-[920px]">
      <LearnSteps step={1} />
      <PageHeader title="What are we learning?" sub="Add your notes if you have them, tell us the topic, and pick the kind of notes." />

      <Card className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-black">Your notes</span>
          <span className="text-xs font-bold text-muted-foreground">Optional</span>
        </div>
        {file ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-background px-3.5 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileText className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[15px] font-black">{file.name}</span>
              <span className="text-[13px] font-bold text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB · {isPdf(file) ? "PDF" : "Photo"}</span>
            </span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => {
                setFile(null);
                if (pick.current) pick.current.value = "";
              }}
              className="rounded-full p-1.5 hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFile(e.dataTransfer.files);
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
            <span className="text-sm font-bold text-muted-foreground">One PDF or one photo (JPG, PNG, WebP) · up to 25 MB. Skip this to learn any topic.</span>
            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
              <Button type="button" variant="soft" size="pill" onClick={() => pick.current?.click()}>
                <FileText /> Choose file
              </Button>
            </div>
          </div>
        )}
        <input ref={pick} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => addFile(e.target.files)} />
      </Card>

      <Card className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={promptId} className="text-[13px] font-extrabold text-muted-foreground">
              {hasFiles ? "Which part of your notes? (optional)" : noteType === "plan" ? "What should the plan cover?" : "What do you want explained?"}
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
            placeholder={hasFiles ? "Leave empty to explain the whole file, or e.g. chapter 3, pages 40-55" : "e.g. How does photosynthesis work?"}
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
              {hasFiles ? "Leave it empty for the whole file, or name a topic, chapter or page range." : "Any topic or question."}{" "}
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
              aria-checked={noteType === "plan"}
              onClick={() => setNoteType("plan")}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left",
                noteType === "plan" ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky-ink" aria-hidden="true">
                <CalendarDays className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-[15px] font-black">Study plan</span>
                <span className="text-[13px] font-bold text-muted-foreground">The main topic split into subtopics, each explained with a diagram</span>
              </span>
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
          <Sparkles /> {noteType === "plan" ? "Make my study plan" : hasFiles ? "Make my notes" : "Explain it to me"}
        </Button>
      </Card>

      {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
    </Page>
  );
}
