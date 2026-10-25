"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Swords } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { tintOf } from "@/components/qn/duel";
import { Face } from "@/components/qn/sprite";
import { Card, EmptyState, Notice, PageHeader, Segmented, Spinner, Working } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { type Friends, SocialError, socialApi } from "@/lib/social-api";
import { useQN } from "@/lib/store";
import { cn } from "@/lib/utils";

const POLL_MS = 10_000;
const choiceClass = (on: boolean) => cn("rounded-2xl border px-3.5 py-3 text-left text-[15px] font-extrabold", on ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted");

/** Pick an online friend and a lesson; the friend gets an invite and you both play at the same time. */
export function NewChallenge() {
  const router = useRouter();
  const params = useSearchParams();
  const recent = useQN((s) => s.recent);
  const lessons = recent.filter((r) => r.kind === "lesson");
  const [data, setData] = useState<Friends | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [friendChoice, setFriend] = useState<string | null>(null);
  const [lessonChoice, setLesson] = useState<string | null>(null);
  const [count, setCount] = useState<"3" | "5" | "8">("5");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only online friends can be challenged, and that changes while the page is open.
  useEffect(() => {
    const load = () =>
      socialApi
        .friends(true)
        .then((d) => {
          setData(d);
          setLoadError(null);
        })
        .catch((e) => setLoadError(e instanceof SocialError ? e.message : "Couldn’t load your friends."));
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(t);
  }, []);

  const friends = (data?.friends ?? []).filter((f) => !f.busy);
  const wanted = friendChoice ?? params.get("friend");
  const friend = friends.find((f) => f.id === wanted) ?? friends[0];
  const lessonId = lessonChoice ?? params.get("lesson") ?? lessons[0]?.id ?? "";

  async function start() {
    if (!friend) return setError("Pick a friend who is online.");
    if (!lessonId) return setError("Pick a lesson first.");
    setError(null);
    setCreating(true);
    try {
      const duel = await socialApi.createDuel(friend.id, lessonId, Number(count));
      router.replace(`/play/challenge/${duel.id}`);
    } catch (e) {
      setError(e instanceof SocialError ? e.message : "Couldn’t set up the duel. Try again.");
      setCreating(false);
    }
  }

  if (creating)
    return (
      <Page className="max-w-[720px]">
        <Working title={`Setting up your duel with ${friend?.display_name ?? "your friend"}…`} steps={["Reading the lesson", "Writing questions", "Checking the answers", "Sending the invite"]} />
      </Page>
    );

  return (
    <Page className="max-w-[880px]">
      <PageHeader title="Challenge a friend" sub="Live duel: same questions, same time, each on your own phone" back={{ href: "/friends", label: "Back to Friends" }} />
      {loadError && <Notice>{loadError}</Notice>}
      {!data && !loadError && (
        <Card className="flex items-center justify-center gap-2.5 p-8 text-[15px] font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand" /> Checking who’s online…
        </Card>
      )}
      {data && friends.length === 0 && (
        <EmptyState
          title="No friends online"
          action={
            <Link href="/friends" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
              Go to Friends
            </Link>
          }
        >
          You can challenge a friend while they have the app open. This page updates by itself when someone comes online.
        </EmptyState>
      )}
      {data && friends.length > 0 && lessons.length === 0 && (
        <EmptyState
          title="Make a lesson first"
          action={
            <Link href="/learn/new" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
              New lesson
            </Link>
          }
        >
          Duel questions come from one of your lessons.
        </EmptyState>
      )}
      {data && friends.length > 0 && lessons.length > 0 && (
        <>
          {wanted && friend?.id !== wanted && <Notice tone="warn">That friend isn’t free right now. Pick someone who’s online.</Notice>}
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[15px] font-black">Online friends</span>
            <div role="radiogroup" aria-label="Friend" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {friends.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={f.id === friend?.id} onClick={() => setFriend(f.id)} className={cn(choiceClass(f.id === friend?.id), "flex items-center gap-3")}>
                  <span className="relative">
                    <Face id={f.avatar} size={40} tint={tintOf(f.avatar)} />
                    <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-card bg-[#3fbf7f]" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate">{f.display_name}</span>
                    <span className="truncate text-[13px] font-bold text-muted-foreground">@{f.username}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[15px] font-black">Lesson</span>
            <div role="radiogroup" aria-label="Lesson" className="flex flex-col gap-2">
              {lessons.slice(0, 6).map((l) => (
                <button key={l.id} type="button" role="radio" aria-checked={l.id === lessonId} onClick={() => setLesson(l.id)} className={choiceClass(l.id === lessonId)}>
                  {l.title}
                </button>
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[15px] font-black">Questions</span>
            <Segmented label="Number of questions" value={count} onChange={setCount} options={[{ value: "3", label: "3" }, { value: "5", label: "5" }, { value: "8", label: "8" }]} />
            <span className="text-[13px] font-bold text-muted-foreground">
              {friend?.display_name ?? "Your friend"} gets an invite to accept straight away. Then you both answer against the same clock.
            </span>
          </Card>
          {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
          <Button variant="brand" size="cta" onClick={start}>
            <Swords /> Challenge {friend?.display_name ?? "friend"}
          </Button>
        </>
      )}
    </Page>
  );
}
