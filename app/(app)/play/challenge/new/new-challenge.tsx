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
import { FriendsError, type FriendsSnapshot, friendsApi } from "@/lib/friends-api";
import { ApiError, learnApi } from "@/lib/learn-api";
import { useQN } from "@/lib/store";
import { cn } from "@/lib/utils";

const choiceClass = (on: boolean) => cn("rounded-2xl border px-3.5 py-3 text-left text-[15px] font-extrabold", on ? "border-brand bg-brand-soft" : "border-line bg-card hover:bg-muted");

/** Pick a friend and a lesson; the questions are written once and both of you answer them on your own phones. */
export function NewChallenge() {
  const router = useRouter();
  const params = useSearchParams();
  const recent = useQN((s) => s.recent);
  const lessons = recent.filter((r) => r.kind === "lesson");
  const [snap, setSnap] = useState<FriendsSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [friendChoice, setFriend] = useState<string | null>(null);
  const [lessonChoice, setLesson] = useState<string | null>(null);
  const [count, setCount] = useState<"3" | "5" | "8">("5");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    friendsApi
      .snapshot()
      .then(setSnap)
      .catch((e) => setLoadError(e instanceof FriendsError ? e.message : "Couldn’t load your friends."));
  }, []);

  const friends = snap?.friends ?? [];
  const friendId = friendChoice ?? (friends.some((f) => f.id === params.get("friend")) ? params.get("friend")! : friends[0]?.id ?? "");
  const lessonId = lessonChoice ?? params.get("lesson") ?? lessons[0]?.id ?? "";
  const friend = friends.find((f) => f.id === friendId);
  const lessonTitle = lessons.find((l) => l.id === lessonId)?.title ?? "your lesson";

  async function start() {
    if (!friend) return setError("Pick a friend first.");
    if (!lessonId) return setError("Pick a lesson first.");
    setError(null);
    setCreating(true);
    try {
      // Scored question sets need a confirmed lesson; if this fails, creating the tournament says why.
      await learnApi.approveLesson(lessonId).catch(() => undefined);
      const t = await learnApi.createTournament(lessonId, Number(count));
      const { id } = await friendsApi.challenge(friend.id, t.id, lessonTitle);
      router.replace(`/play/challenge/${id}`);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof FriendsError ? e.message : "Couldn’t set up the duel. Try again.");
      setCreating(false);
    }
  }

  if (creating)
    return (
      <Page className="max-w-[720px]">
        <Working title={`Setting up your duel with ${friend?.name ?? "your friend"}…`} steps={["Reading the lesson", "Writing questions", "Checking the answers"]} />
      </Page>
    );

  return (
    <Page className="max-w-[880px]">
      <PageHeader title="Challenge a friend" sub="Same questions, each on your own phone" back={{ href: "/friends", label: "Back to Friends" }} />
      {loadError && <Notice>{loadError}</Notice>}
      {!snap && !loadError && (
        <Card className="flex items-center justify-center gap-2.5 p-8 text-[15px] font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand" /> Loading your friends…
        </Card>
      )}
      {snap && friends.length === 0 && (
        <EmptyState
          title="Add a friend first"
          action={
            <Link href="/friends" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
              Go to Friends
            </Link>
          }
        >
          You can challenge anyone who has accepted your friend request.
        </EmptyState>
      )}
      {snap && friends.length > 0 && lessons.length === 0 && (
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
      {snap && friends.length > 0 && lessons.length > 0 && (
        <>
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[15px] font-black">Friend</span>
            <div role="radiogroup" aria-label="Friend" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {friends.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={f.id === friendId} onClick={() => setFriend(f.id)} className={cn(choiceClass(f.id === friendId), "flex items-center gap-3")}>
                  <Face id={f.avatar} size={40} tint={tintOf(f.avatar)} />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate">{f.name}</span>
                    {f.username && <span className="truncate text-[13px] font-bold text-muted-foreground">@{f.username}</span>}
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
            <span className="text-[13px] font-bold text-muted-foreground">You play first. {friend?.name ?? "Your friend"} gets the duel on their Friends page, and you both see who won once they’ve played.</span>
          </Card>
          {error && <Notice onClose={() => setError(null)}>{error}</Notice>}
          <Button variant="brand" size="cta" onClick={start}>
            <Swords /> Challenge {friend?.name ?? "friend"}
          </Button>
        </>
      )}
    </Page>
  );
}
