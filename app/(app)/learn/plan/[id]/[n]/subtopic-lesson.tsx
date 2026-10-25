"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Page } from "@/components/qn/app-shell";
import { useLearnerAge } from "@/components/qn/learn-bits";
import { Notice, PageHeader, Working } from "@/components/qn/ui";
import { buttonVariants } from "@/components/ui/button";
import { ApiError, learnApi } from "@/lib/learn-api";
import { bump, markStudiedToday, setSubtopicLesson, useQN } from "@/lib/store";
import { subtopicTopic, type StudyPlan } from "@/lib/study-plan";
import { cn } from "@/lib/utils";

// One request per subtopic, even when React runs the effect twice or the page is shown again mid-way.
const inFlight = new Map<string, Promise<string>>();

/** Pick the part of the upload for this subtopic; a title the pages don't contain studies the whole upload. */
async function lessonTopic(plan: StudyPlan, index: number) {
  const topic = subtopicTopic(plan, plan.subtopics[index]);
  if (!plan.material) return topic;
  try {
    await learnApi.findPages(plan.material.id, topic);
    return topic;
  } catch (e) {
    if (e instanceof ApiError && e.status === 422) return `pages 1-${plan.material.pages}`;
    throw e;
  }
}

async function lessonFor(plan: StudyPlan, index: number, age: number) {
  const cached = plan.subtopics[index].lessonId;
  // Lessons live in the learning server's memory, so a cached one can be gone after a restart.
  if (cached && (await learnApi.getLesson(cached).then(() => true, () => false))) return cached;
  let lesson;
  try {
    if (plan.material) await learnApi.ensureConfirmed(plan.material.id);
    lesson = await learnApi.createLesson({
      topic: await lessonTopic(plan, index),
      age,
      prefers_visuals: true,
      ...(plan.material ? { material_id: plan.material.id } : {}),
    });
  } catch (e) {
    // The file doesn't cover this subtopic (or is gone after a restart): teach it from general knowledge.
    if (!plan.material || !(e instanceof ApiError) || ![404, 409, 422].includes(e.status)) throw e;
    lesson = await learnApi.createLesson({ topic: subtopicTopic({ ...plan, material: null }, plan.subtopics[index]), age, prefers_visuals: true });
  }
  setSubtopicLesson(plan.id, index, lesson.id);
  bump(["d-lesson", "w-lessons"]);
  markStudiedToday();
  return lesson.id;
}

const noop = () => () => {};

/** A subtopic of a study plan opens as a full lesson: made on first visit, then reused. */
export function SubtopicLesson({ planId, index }: { planId: string; index: number }) {
  const router = useRouter();
  const plan = useQN((s) => s.plans.find((p) => p.id === planId));
  const hydrated = useSyncExternalStore(noop, () => true, () => false); // the store is in localStorage
  const { age, loading: ageLoading } = useLearnerAge();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const sub = plan?.subtopics[index];

  useEffect(() => {
    if (!plan || !sub || !age) return;
    const key = `${plan.id}:${index}:${attempt}`;
    let job = inFlight.get(key);
    if (!job) {
      job = lessonFor(plan, index, age);
      inFlight.set(key, job);
      job.catch(() => inFlight.delete(key));
    }
    let live = true;
    job.then(
      (id) => live && router.replace(`/learn/lesson/${id}`),
      (e) => live && setError(e instanceof ApiError ? e.message : "Couldn’t write this lesson. Try again."),
    );
    return () => {
      live = false;
    };
    // `plan` changes when the lesson id is saved; the job key already covers what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, sub?.title, index, age, attempt, router]);

  const back = { href: `/learn#plan-${planId}`, label: "Back to the plan" };

  if (hydrated && (!plan || !sub))
    return (
      <Page className="max-w-[720px]">
        <PageHeader title="Subtopic not found" back={back} />
        <Notice>This study plan isn’t saved in this browser any more.</Notice>
        <Link href="/learn" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
          Go to Learn
        </Link>
      </Page>
    );

  if (!ageLoading && hydrated && !age)
    return (
      <Page className="max-w-[720px]">
        <PageHeader title={sub?.title ?? "Study plan"} back={back} />
        <Notice tone="warn">
          We don’t know your age yet.{" "}
          <Link href="/settings" className="font-black underline">
            Add it once in Settings
          </Link>{" "}
          so the lesson matches your level.
        </Notice>
      </Page>
    );

  if (error)
    return (
      <Page className="max-w-[720px]">
        <PageHeader title={sub?.title ?? "Study plan"} back={back} />
        <Notice>{error}</Notice>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          className={cn(buttonVariants({ variant: "brand", size: "cta" }))}
        >
          Try again
        </button>
      </Page>
    );

  return (
    <Page className="max-w-[720px]">
      <Working
        title={sub ? `Writing “${sub.title}”…` : "Opening your lesson…"}
        steps={["Reading the subtopic", "Planning the sections", "Writing it in detail for your age", "Planning the diagrams"]}
      />
    </Page>
  );
}
