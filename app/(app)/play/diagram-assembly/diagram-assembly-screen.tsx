"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Eye,
  Flag,
  Loader2,
  LockKeyhole,
  Network,
  Play,
  Puzzle,
  RefreshCw,
  RotateCcw,
  Shuffle,
  Trophy,
  Users,
} from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { FrozenDiagram, ClearBoardButton } from "@/components/qn/diagram-board";
import {
  Card,
  EmptyState,
  Field,
  Notice,
  PageHeader,
  ProgressBar,
} from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import {
  createDiagramApi,
  errorMessage,
  type DiagramLesson,
  type LessonSummary,
} from "@/lib/diagram-api";
import { formatRaceTime } from "@/lib/diagram-race-clock";
import { useDiagramAssembly } from "@/lib/use-diagram-assembly";
import { useUser } from "@/lib/use-user";
import { useClientValue } from "@/lib/use-client-value";
import { capturedPlayersReady } from "@/lib/diagram-room";
import { cn } from "@/lib/utils";

type Choice = { lessonId: string; visualId: string };
type Game = ReturnType<typeof useDiagramAssembly>;
const isTerminal = (status?: string) =>
  status === "finished" || status === "expired" || status === "cancelled";
const SOURCE_REASONS: Record<string, string> = {
  source_unavailable: "The source lesson is no longer available.",
  source_unapproved: "Approval was withdrawn from the source lesson.",
  source_changed:
    "The source diagram changed. Create a new round from its latest approved version.",
  host_cancelled: "The host cancelled this round.",
};

export function DiagramAssemblyScreen() {
  const { user, loading } = useUser();
  const game = useDiagramAssembly(user?.playerId);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [enteredCode, setCode] = useState<string | null>(null);
  const inviteCode = useClientValue(
    () => new URLSearchParams(window.location.search).get("code") ?? "",
    "",
  );
  const code =
    enteredCode ??
    (/^[A-Z0-9]{8}$/i.test(inviteCode) ? inviteCode.toUpperCase() : "");
  const [selected, setSelected] = useState<string | null>(null);
  const name = (displayName.trim() || user?.name || "").slice(0, 60);

  if (loading || (user && !game.booted))
    return (
      <Page>
        <PageHeader title="Diagram Assembly" />
        <Loading>Loading your player…</Loading>
      </Page>
    );
  if (!user)
    return (
      <Page>
        <Notice>
          Your session ended.{" "}
          <Link href="/login" className="underline">
            Sign in again
          </Link>
          .
        </Notice>
      </Page>
    );
  if (game.saved && !game.room)
    return (
      <Page>
        <PageHeader title="Diagram Assembly" />
        <Loading>Reconnecting to your room…</Loading>
        {game.error && <Notice>{game.error}</Notice>}
        <Button variant="soft" size="pill" onClick={game.forgetRoom}>
          Back to setup
        </Button>
      </Page>
    );

  const host = game.room?.host_id === user.playerId;
  const race = game.race;
  const done = isTerminal(race?.status);
  const currentAttempt = game.attempt;
  const board = currentAttempt?.board;
  const myAttemptEnded = !!(
    game.me?.completed ||
    game.me?.forfeited ||
    currentAttempt?.lastAction?.completed ||
    currentAttempt?.lastAction?.forfeited
  );
  const activeBoard =
    !!race &&
    (race.status === "countdown" || race.status === "running") &&
    race.source.available &&
    !myAttemptEnded;
  const selectedCard = board?.cards.find((card) => card.id === selected);
  const clock = game.clock;
  const wrong = currentAttempt?.incorrectSlotIds ?? [];

  function place(slotId: string, cardId: string | null) {
    game.place(slotId, cardId);
    setSelected(null);
  }

  return (
    <Page className="max-w-[1220px]">
      <PageHeader
        title="Diagram Assembly"
        sub={
          game.room
            ? "How does this work?"
            : "Study it. Shuffle it. Piece it together."
        }
        back={{ href: "/play", label: "Back to Play" }}
        right={
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-extrabold text-brand-dark">
            <Users className="size-3.5" />
            2–8 players
          </span>
        }
      />
      {game.error && (
        <Notice onClose={game.dismissError}>
          {game.error}{" "}
          <button
            type="button"
            className="ml-1 underline"
            onClick={game.refresh}
          >
            Refresh
          </button>
        </Notice>
      )}
      {game.busy && (
        <div
          role="status"
          className="flex items-center gap-2 text-sm font-bold text-brand"
        >
          <Loader2 className="size-4 animate-spin" />
          {game.busy}…
        </div>
      )}

      {!game.room ? (
        <>
          <section className="grid overflow-hidden rounded-[28px] border border-[#d3e5db] bg-[#e6f2eb] md:grid-cols-[1.15fr_.85fr]">
            <div className="flex flex-col items-start gap-4 p-6 md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-brand-dark">
                <Puzzle className="size-4" />
                THE RACE TO REBUILD
              </span>
              <h2 className="text-3xl leading-[1.08] font-black tracking-tight md:text-[42px]">
                See the big picture.
                <br />
                <span className="text-brand">Piece it together.</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed font-bold text-[#516b5d]">
                Pick a saved diagram and race to put its labels back. The
                fastest perfect diagram wins.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-extrabold text-brand-dark">
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  Separate phones
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-4" />
                  15-minute limit
                </span>
              </div>
            </div>
            <ol className="flex flex-col justify-center gap-5 border-t border-[#d3e5db] bg-white/30 p-6 md:border-t-0 md:border-l md:p-8">
              <Step
                icon={<Eye className="size-5" />}
                title="Study the original"
                body="Remember the labels and connections."
              />
              <Step
                icon={<Shuffle className="size-5" />}
                title="Rebuild the diagram"
                body="Everyone receives the same shuffled tray order."
              />
              <Step
                icon={<Flag className="size-5" />}
                title="Finish perfectly"
                body="Correct every label to record a ranked finish."
              />
            </ol>
          </section>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Card className="flex min-w-0 flex-col gap-5 p-5 md:p-6">
              <div>
                <h2 className="text-xl font-black">Host a round</h2>
                <p className="mt-1 text-sm font-bold text-muted-foreground">
                  Choose an approved lesson and a saved flowchart.
                </p>
              </div>
              <SourcePicker
                api={game.api}
                disabled={!!game.busy}
                onChoice={setChoice}
              />
              <Button
                variant="brand"
                size="cta"
                disabled={!!game.busy || !choice || !name}
                onClick={() =>
                  choice &&
                  void game.createRoom(choice.lessonId, choice.visualId, name)
                }
              >
                Create private room
                <ArrowRight />
              </Button>
              <p className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <LockKeyhole className="size-3.5" />
                Invite players after your diagram is prepared.
              </p>
            </Card>
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-lg font-black">Join your people</h2>
              <Field
                label="Your display name"
                value={displayName}
                placeholder={user.name}
                maxLength={60}
                onChange={(event) => setDisplayName(event.target.value)}
                hint="Used when hosting or joining."
              />
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (/^[A-Z0-9]{8}$/.test(code) && name)
                    void game.join(code, name);
                }}
              >
                <Field
                  label="Room code"
                  autoComplete="off"
                  value={code}
                  maxLength={8}
                  placeholder="8-character code"
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(/[^a-z0-9]/gi, "")
                        .toUpperCase(),
                    )
                  }
                />
                <Button
                  type="submit"
                  variant="soft"
                  size="cta"
                  disabled={!!game.busy || !/^[A-Z0-9]{8}$/.test(code) || !name}
                >
                  Join room
                  <ArrowRight />
                </Button>
              </form>
              <p className="text-xs font-bold leading-relaxed text-muted-foreground">
                Each player needs their own account. The same account on two
                phones counts as one player.
              </p>
            </Card>
          </div>
        </>
      ) : (
        <>
          {game.room.closed && (
            <Notice tone="warn">
              This room is closed. Readiness and new joins are disabled.
            </Notice>
          )}
          {race && !race.source.available && (
            <Notice tone="warn">
              {SOURCE_REASONS[race.source.reason ?? ""] ??
                "The source diagram is unavailable."}{" "}
              {done
                ? "The saved results remain available."
                : "This round cannot continue."}
            </Notice>
          )}
          {race?.status === "cancelled" && (
            <Notice tone="warn">
              {SOURCE_REASONS[race.reason ?? ""] ?? "This round was cancelled."}{" "}
              It cannot be reopened. Start a new round to play again.
            </Notice>
          )}

          {activeBoard && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Puzzle className="size-6" />
                </span>
                <div>
                  <p className="text-sm font-black">Your reconstruction</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {clock?.expired
                      ? "Time is up. Waiting for server results."
                      : game.playable
                        ? "The race is on. Make every label count."
                        : "Your labels unlock when the shared countdown ends."}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2",
                  (clock?.remainingSeconds ?? 900) <= 60
                    ? "bg-rose text-destructive"
                    : "bg-warn text-warn-ink",
                )}
                role="timer"
                aria-label={`${formatRaceTime(clock?.remainingSeconds ?? 900)} remaining`}
              >
                <Clock3 className="size-5" />
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-wider">
                    Time left
                  </span>
                  <span className="font-mono text-2xl font-extrabold tabular-nums">
                    {formatRaceTime(clock?.remainingSeconds ?? 900)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "grid items-start gap-5",
              activeBoard
                ? "xl:grid-cols-[minmax(0,1fr)_290px]"
                : "lg:grid-cols-[minmax(0,1fr)_300px]",
            )}
          >
            <div className="flex min-w-0 flex-col gap-5">
              {activeBoard ? (
                board && currentAttempt ? (
                  <>
                    <Card className="relative min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-5 py-4">
                        <h2 className="flex items-center gap-2 text-base font-black">
                          <Network className="size-4 text-brand" />
                          Puzzle board
                        </h2>
                        <span className="text-xs font-bold text-muted-foreground">
                          {board.slots.length} labels
                        </span>
                      </div>
                      <div className="relative">
                        <FrozenDiagram
                          svg={board.puzzle_svg}
                          viewBox={board.view_box}
                          board={board}
                          placements={currentAttempt.placements}
                          selected={selectedCard?.id ?? null}
                          wrong={wrong}
                          disabled={!game.playable || !!game.busy}
                          onPlace={place}
                        />
                        {!clock?.started && (
                          <div
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#f1f7f4]/95 text-center"
                            role="status"
                            aria-live="polite"
                          >
                            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-black text-brand-dark">
                              READY TO REBUILD?
                            </span>
                            <span className="text-8xl font-black text-brand tabular-nums">
                              {clock?.countdownSeconds ?? "…"}
                            </span>
                            <p className="text-sm font-bold text-muted-foreground">
                              Everyone starts together.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                    <Card className="flex flex-col gap-4 p-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black">Your labels</h2>
                        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-black text-brand-dark">
                          {Object.keys(currentAttempt.placements).length}/
                          {board.slots.length} placed
                        </span>
                      </div>
                      <p
                        className="rounded-xl bg-field px-3 py-2.5 text-sm font-bold text-muted-foreground"
                        role="status"
                      >
                        {selectedCard ? (
                          <>
                            Place <strong>{selectedCard.text}</strong> in a
                            blank on the board.
                          </>
                        ) : (
                          "Choose a label, then a numbered slot. Tap a placed label to return it. Keyboard slot controls are below the board."
                        )}
                      </p>
                      <div
                        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                        role="group"
                        aria-label="Available labels"
                      >
                        {board.cards
                          .filter(
                            (card) =>
                              !Object.values(
                                currentAttempt.placements,
                              ).includes(card.id),
                          )
                          .map((card) => (
                            <button
                              key={card.id}
                              type="button"
                              disabled={!game.playable || !!game.busy}
                              draggable={game.playable && !game.busy}
                              onDragStart={(event) => {
                                event.dataTransfer.setData(
                                  "text/plain",
                                  card.id,
                                );
                                event.dataTransfer.effectAllowed = "move";
                                setSelected(card.id);
                              }}
                              onDragEnd={() => setSelected(null)}
                              aria-pressed={selected === card.id}
                              onClick={() =>
                                setSelected(
                                  selected === card.id ? null : card.id,
                                )
                              }
                              className={cn(
                                "flex min-h-12 items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-extrabold transition-colors disabled:opacity-50",
                                selected === card.id
                                  ? "border-brand bg-brand-soft text-brand-dark ring-2 ring-brand/15"
                                  : "border-input bg-white shadow-[0_2px_0_#e3e8ec] hover:border-brand hover:bg-brand-soft/40",
                              )}
                            >
                              <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-input">
                                {selected === card.id ? (
                                  <Check className="size-3.5" />
                                ) : (
                                  <span className="size-1.5 rounded-full bg-brand/50" />
                                )}
                              </span>
                              <span className="min-w-0 break-words">
                                {card.text}
                              </span>
                            </button>
                          ))}
                      </div>
                      <ClearBoardButton
                        disabled={!selected}
                        onClear={() => setSelected(null)}
                      />
                      {wrong.length > 0 && (
                        <Notice>
                          {wrong.length}{" "}
                          {wrong.length === 1 ? "slot needs" : "slots need"}{" "}
                          another look. The clock keeps running.
                        </Notice>
                      )}
                      {currentAttempt.error && (
                        <Notice>
                          {currentAttempt.error}{" "}
                          {currentAttempt.dirty && (
                            <button
                              type="button"
                              onClick={() => void game.retrySave()}
                              className="underline"
                            >
                              Retry save
                            </button>
                          )}
                        </Notice>
                      )}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                          variant="brand"
                          size="cta"
                          disabled={
                            !game.playable ||
                            !!game.busy ||
                            currentAttempt.saving ||
                            Object.keys(currentAttempt.placements).length !==
                              board.slots.length
                          }
                          onClick={() => void game.finish()}
                        >
                          Check diagram
                          <ArrowRight />
                        </Button>
                        <span
                          className="text-xs font-bold text-muted-foreground"
                          role="status"
                        >
                          {currentAttempt.saving
                            ? "Saving placements…"
                            : currentAttempt.dirty
                              ? "Unsaved changes"
                              : "All placements saved"}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!!game.busy || !game.playable}
                        onClick={() => {
                          if (
                            window.confirm(
                              "End your attempt? This round cannot be resumed after forfeiting.",
                            )
                          )
                            void game.forfeit();
                        }}
                        className="self-start py-2 text-xs font-black text-muted-foreground underline disabled:opacity-40"
                      >
                        Forfeit this attempt
                      </button>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <Loading>Loading your board…</Loading>
                  </Card>
                )
              ) : null}

              {(!race || race.status === "waiting") && (
                <Card className="min-w-0 overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <Eye className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black">
                        {race ? "Study the diagram" : "Get everyone together"}
                      </h2>
                      <p className="text-xs font-bold text-muted-foreground">
                        {race
                          ? "Remember the labels and connections before the race."
                          : "The host creates the round once 2–8 players have joined."}
                      </p>
                    </div>
                  </div>
                  {game.study ? (
                    <FrozenDiagram
                      svg={game.study.reference_svg}
                      viewBox={game.study.view_box}
                    />
                  ) : race ? (
                    <Loading>Loading the study diagram…</Loading>
                  ) : (
                    <div className="flex flex-col items-center gap-3 bg-[#edf6f0] p-9 text-center">
                      <Puzzle className="size-14 text-brand/60" />
                      <p className="max-w-sm text-sm font-bold text-muted-foreground">
                        {game.management && !isTerminal(game.management.status)
                          ? "A round is already in progress. You can join the next one."
                          : host
                            ? "Invite your players using the room code, then create a round."
                            : "You’re in. Wait for the host to create a round."}
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {myAttemptEnded && race && !done && (
                <Card className="flex flex-col items-center gap-4 p-7 text-center">
                  <Check className="size-12 text-brand" />
                  <h2 className="text-2xl font-black">
                    {game.me?.forfeited || currentAttempt?.lastAction?.forfeited
                      ? "Your attempt has ended"
                      : "Your perfect finish is saved!"}
                  </h2>
                  {currentAttempt?.lastAction?.elapsed_ms != null && (
                    <p className="text-lg font-black tabular-nums">
                      {formatRaceTime(
                        currentAttempt.lastAction.elapsed_ms / 1000,
                      )}
                    </p>
                  )}
                  <p className="max-w-md text-sm font-bold text-muted-foreground">
                    Results and the solution unlock when every attempt ends or
                    the time limit expires.
                  </p>
                </Card>
              )}

              {(race?.status === "finished" || race?.status === "expired") &&
                (game.results ? (
                  <ResultsPanel game={game} />
                ) : (
                  <Card>
                    <Loading>Loading the server results…</Loading>
                  </Card>
                ))}

              {host && (!race || done) && <HostDiagramPicker game={game} />}
            </div>
            <RoomPanel game={game} playerId={user.playerId} />
          </div>
        </>
      )}
    </Page>
  );
}

function SourcePicker({
  api,
  disabled,
  onChoice,
}: {
  api: ReturnType<typeof createDiagramApi>;
  disabled: boolean;
  onChoice: (choice: Choice | null) => void;
}) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState("");
  const [lesson, setLesson] = useState<DiagramLesson | null>(null);
  const [visualId, setVisualId] = useState("");
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [reviewedLesson, setReviewedLesson] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    api
      .lessons("", abort.signal)
      .then((page) => {
        setLessons(page.items);
        setCursor(page.next_cursor);
        setProblem(null);
      })
      .catch((error) => {
        if (!abort.signal.aborted) setProblem(errorMessage(error));
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [api, reload]);
  useEffect(() => {
    if (!lessonId) return;
    const abort = new AbortController();
    api
      .lesson(lessonId, abort.signal)
      .then((value) => {
        setLesson(value);
        const visual =
          value.status === "approved"
            ? value.visuals.find((item) => item.kind === "diagram")
            : undefined;
        setVisualId(visual?.id ?? "");
        onChoice(visual ? { lessonId: value.id, visualId: visual.id } : null);
        setProblem(null);
      })
      .catch((error) => {
        if (!abort.signal.aborted) setProblem(errorMessage(error));
      });
    return () => abort.abort();
  }, [api, lessonId, onChoice, reload]);
  async function more() {
    if (!cursor) return;
    setLoading(true);
    try {
      const page = await api.lessons(cursor);
      setLessons((items) => [...items, ...page.items]);
      setCursor(page.next_cursor);
    } catch (error) {
      setProblem(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }
  if (loading && !lessons.length)
    return <Loading>Loading saved lessons…</Loading>;
  return (
    <div className="flex flex-col gap-4">
      {problem && (
        <Notice>
          {problem}
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="ml-1 underline"
          >
            Retry
          </button>
        </Notice>
      )}
      {!lessons.length && !problem ? (
        <EmptyState
          title="No saved lessons yet"
          action={
            <Link
              href="/learn"
              className="text-sm font-black text-brand underline"
            >
              Go to Learn
            </Link>
          }
        >
          Save and approve a lesson diagram before hosting a race. You can still
          join someone else’s room.
        </EmptyState>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-black">
            Saved lesson
            <select
              disabled={disabled || approving}
              value={lessonId}
              onChange={(event) => {
                setLessonId(event.target.value);
                setLesson(null);
                setVisualId("");
                onChoice(null);
              }}
              className="h-12 w-full rounded-xl border border-input bg-field px-3 font-bold"
            >
              <option value="">Choose a lesson</option>
              {lessons.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title ?? item.id}
                  {item.status === "draft" ? " · draft" : ""}
                </option>
              ))}
            </select>
          </label>
          {cursor && (
            <button
              type="button"
              disabled={loading || disabled}
              onClick={() => void more()}
              className="self-start text-xs font-black text-brand underline"
            >
              {loading ? "Loading…" : "Load more lessons"}
            </button>
          )}
          {lessonId && !lesson && !problem && (
            <Loading>Loading lesson visuals…</Loading>
          )}
          {lesson && lesson.status !== "approved" && (
            <div className="flex flex-col gap-3 rounded-2xl bg-warn p-4">
              <p className="text-sm font-bold text-warn-ink">
                Review this saved lesson and its diagrams before approving it
                for play.
              </p>
              <Link
                href={`/learn/lesson/${encodeURIComponent(lesson.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="self-start text-sm font-black text-brand underline"
              >
                Open lesson and diagrams for review
              </Link>
              <label className="flex items-start gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-brand"
                  checked={reviewedLesson === lesson.id + ":" + lesson.revision}
                  onChange={(event) =>
                    setReviewedLesson(
                      event.target.checked
                        ? lesson.id + ":" + lesson.revision
                        : null,
                    )
                  }
                  disabled={disabled || approving}
                />
                I have reviewed this lesson and its saved diagrams.
              </label>
              <Button
                variant="soft"
                size="pill"
                disabled={
                  disabled ||
                  approving ||
                  reviewedLesson !== lesson.id + ":" + lesson.revision
                }
                onClick={() => {
                  setApproving(true);
                  setProblem(null);
                  void api
                    .approveLesson(lesson.id, lesson.revision)
                    .then(() => api.lesson(lesson.id))
                    .then((approved) => {
                      setLesson(approved);
                      setLessons((items) =>
                        items.map((item) =>
                          item.id === approved.id
                            ? { ...item, status: approved.status }
                            : item,
                        ),
                      );
                      const visual =
                        approved.status === "approved"
                          ? approved.visuals.find(
                              (item) => item.kind === "diagram",
                            )
                          : undefined;
                      setVisualId(visual?.id ?? "");
                      onChoice(
                        visual
                          ? { lessonId: approved.id, visualId: visual.id }
                          : null,
                      );
                    })
                    .catch((error) => setProblem(errorMessage(error)))
                    .finally(() => setApproving(false));
                }}
              >
                {approving ? "Approving…" : "Approve reviewed lesson"}
                <Check />
              </Button>
            </div>
          )}
          {lesson?.status === "approved" && (
            <label className="flex flex-col gap-1.5 text-sm font-black">
              Saved diagram
              <select
                disabled={disabled || approving}
                value={visualId}
                onChange={(event) => {
                  setVisualId(event.target.value);
                  onChoice(
                    event.target.value
                      ? { lessonId: lesson.id, visualId: event.target.value }
                      : null,
                  );
                }}
                className="h-12 w-full rounded-xl border border-input bg-field px-3 font-bold"
              >
                <option value="">Choose a diagram</option>
                {lesson.visuals
                  .filter((visual) => visual.kind === "diagram")
                  .map((visual) => (
                    <option key={visual.id} value={visual.id}>
                      {visual.title || "Untitled diagram"}
                    </option>
                  ))}
              </select>
              {!lesson.visuals.some((visual) => visual.kind === "diagram") && (
                <span className="text-xs font-bold text-muted-foreground">
                  This lesson has no saved diagrams.
                </span>
              )}
            </label>
          )}
          <p className="text-xs font-bold leading-relaxed text-muted-foreground">
            Supports saved Mermaid flowcharts with 2–40 text labels. The server
            checks compatibility when preparing the diagram.
          </p>
        </>
      )}
    </div>
  );
}

function HostDiagramPicker({ game }: { game: Game }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  return (
    <Card className="p-5">
      <details open={!game.saved?.templateId}>
        <summary className="cursor-pointer text-base font-black">
          Choose a different diagram for the next round
        </summary>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          Reuse the prepared diagram with Create round, or prepare another saved
          diagram below.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <SourcePicker
            api={game.api}
            disabled={!!game.busy}
            onChoice={setChoice}
          />
          <Button
            variant="soft"
            size="cta"
            disabled={!choice || !!game.busy}
            onClick={() =>
              choice && void game.prepare(choice.lessonId, choice.visualId)
            }
          >
            Prepare diagram
            <ArrowRight />
          </Button>
          {game.template && (
            <p role="status" className="text-sm font-bold text-brand-dark">
              Diagram prepared · {game.template.slots} labels. Use Create round
              when your players are here.
            </p>
          )}
        </div>
      </details>
    </Card>
  );
}

function RoomPanel({ game, playerId }: { game: Game; playerId: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const room = game.room!;
  const host = room.host_id === playerId;
  const race = game.race;
  const active =
    (race && !isTerminal(race.status)) ||
    (game.management && !isTerminal(game.management.status));
  const canCreate =
    host &&
    !!game.saved?.templateId &&
    room.members.length >= 2 &&
    !room.closed &&
    !active;
  const canStart =
    host &&
    game.saved?.creatorRaceId === race?.id &&
    race?.status === "waiting" &&
    capturedPlayersReady(room, game.saved?.capturedUserIds) &&
    !room.closed;
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <Card className="flex flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">Your room</h2>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-black text-brand-dark">
          {room.members.length}/{room.capacity}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-dashed border-[#a9c6b6] bg-[#f1f7f4] p-4">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Invite code
          </span>
          <span className="select-all font-mono text-xl font-black tracking-[.12em]">
            {room.code}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy room code"
          className="flex size-11 items-center justify-center rounded-xl border border-line bg-white text-brand"
        >
          {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
        </button>
      </div>
      <span className="sr-only" role="status">
        {copied ? "Room code copied" : ""}
      </span>
      {copyError && (
        <Notice>
          Could not copy. Select the code above to copy it manually.
        </Notice>
      )}
      <ul className="flex flex-col gap-2">
        {room.members.map((member) => (
          <li
            key={member.user_id}
            className="flex items-center gap-2.5 rounded-xl bg-field px-3 py-2.5"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-soft text-xs font-black text-sky-ink">
              {member.display_name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black">
                {member.display_name}
                {member.user_id === playerId ? " (you)" : ""}
              </span>
              <span className="block text-[10px] font-bold text-muted-foreground">
                {member.user_id === room.host_id ? "Host" : "Player"}
              </span>
            </span>
            <span
              className={cn(
                "text-[10px] font-black",
                member.ready ? "text-brand" : "text-muted-foreground",
              )}
            >
              {member.ready ? "READY" : "NOT READY"}
            </span>
          </li>
        ))}
      </ul>
      {race && (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Round progress
          </h3>
          {race.players.map((player) => (
            <div key={player.id}>
              <div className="mb-1 flex justify-between gap-2 text-xs font-extrabold">
                <span className="truncate">
                  {player.display_name}
                  {player.id === race.my_player_id ? " (you)" : ""}
                </span>
                <span className="shrink-0">
                  {player.forfeited
                    ? "Forfeited"
                    : player.completed
                      ? "Finished"
                      : `${player.placed}/${race.total}`}
                </span>
              </div>
              <ProgressBar
                value={(player.placed / race.total) * 100}
                className="h-1.5"
              />
            </div>
          ))}
        </div>
      )}
      {(!race || race.status === "waiting" || isTerminal(race.status)) &&
        !room.closed && (
          <Button
            variant="soft"
            size="pill"
            disabled={!!game.busy}
            onClick={() => void game.ready()}
          >
            {room.members.find((member) => member.user_id === playerId)?.ready
              ? "Mark not ready"
              : "I’m ready"}
            <Check />
          </Button>
        )}
      {host && (!race || isTerminal(race.status)) && (
        <Button
          variant="brand"
          size="cta"
          className="w-full text-base"
          disabled={!canCreate || !!game.busy}
          onClick={() => void game.createRace()}
        >
          <RotateCcw className="size-4" />
          {race ? "Create new round" : "Create round"}
        </Button>
      )}
      {host && race?.status === "waiting" && (
        <Button
          variant="brand"
          size="cta"
          className="w-full text-base"
          disabled={!canStart || !!game.busy}
          onClick={() => void game.start()}
        >
          <Play className="size-4" />
          Start race
        </Button>
      )}
      {!race && room.members.length < 2 && (
        <p className="text-xs font-bold text-muted-foreground">
          Invite at least one more player to create a round.
        </p>
      )}
      {race?.status === "waiting" && (
        <p className="text-xs font-bold leading-relaxed text-muted-foreground">
          Everyone captured in this round must be present and ready. The
          creating host starts the five-second countdown.
        </p>
      )}
      {host && active && (
        <button
          type="button"
          disabled={!!game.busy}
          className="self-start py-2 text-xs font-black text-destructive underline"
          onClick={() => {
            if (window.confirm("Cancel this round for everyone?"))
              void game.cancel();
          }}
        >
          Cancel round
        </button>
      )}
      <button
        type="button"
        disabled={!!game.busy}
        className="self-start py-2 text-xs font-black text-muted-foreground underline"
        onClick={() => {
          if (
            !active ||
            window.confirm("Leave this room? The race clock will keep running.")
          )
            void game.leave();
        }}
      >
        Leave room
      </button>
      <button
        type="button"
        onClick={game.refresh}
        className="flex items-center gap-1.5 self-start text-xs font-black text-brand"
      >
        <RefreshCw className="size-3.5" />
        Refresh room
      </button>
    </Card>
  );
}

function ResultsPanel({ game }: { game: Game }) {
  const results = game.results!;
  const mine = results.players.find(
    (player) => player.id === game.race?.my_player_id,
  );
  const winner = results.winner_ids.includes(game.race?.my_player_id ?? "");
  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col items-center gap-3 bg-brand-soft p-7 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl border-4 border-white bg-coin text-coin-ink">
          <Trophy className="size-8" />
        </span>
        <span className="text-xs font-black uppercase tracking-wider text-brand-dark">
          {results.status === "expired"
            ? "TIME LIMIT REACHED"
            : "RACE COMPLETE"}
        </span>
        <h2 className="text-3xl font-black">
          {winner
            ? results.winner_ids.length > 1
              ? "A shared first place!"
              : "You pieced it together first!"
            : mine?.completed
              ? "A perfect reconstruction!"
              : "Another round, a fresh start."}
        </h2>
        <p className="text-sm font-bold text-muted-foreground">
          Only perfect completions rank. Ties share the same place.
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line py-5">
        <Stat
          label="Your rank"
          value={mine?.rank != null ? "#" + mine.rank : "—"}
        />
        <Stat
          label="Finish time"
          value={
            mine?.elapsed_ms != null
              ? formatRaceTime(mine.elapsed_ms / 1000)
              : "—"
          }
        />
        <Stat label="Checks" value={String(mine?.submissions ?? 0)} />
      </div>
      <ol className="flex flex-col gap-2 p-5">
        {results.players.map((player) => (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-xl bg-field p-3 text-sm font-black"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-white text-brand">
              {player.rank ?? "—"}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {player.display_name}
              {player.id === mine?.id ? " (you)" : ""}
            </span>
            <span className="shrink-0 font-mono text-xs">
              {player.elapsed_ms != null
                ? formatRaceTime(player.elapsed_ms / 1000)
                : player.forfeited
                  ? "Forfeited"
                  : "Unfinished"}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-4 border-t border-line p-5">
        {game.race?.source.available && !game.review && (
          <Button
            variant="soft"
            size="cta"
            disabled={!!game.busy}
            onClick={() => void game.loadReview()}
          >
            <Eye />
            Review solution
          </Button>
        )}
        {!game.race?.source.available && (
          <Notice tone="warn">
            The source is unavailable. Results remain readable, but solution
            access is blocked.
          </Notice>
        )}
        {game.reviewError && <Notice>{game.reviewError}</Notice>}
        {game.review && game.race?.source.available && (
          <>
            <h3 className="text-lg font-black">The complete picture</h3>
            <FrozenDiagram svg={game.review.reference_svg} />
            <ol className="grid gap-2 text-sm font-bold sm:grid-cols-2">
              {game.review.solution.map((item, index) => (
                <li key={item.slot_id} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    Slot {index + 1}: {item.text}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </Card>
  );
}
function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-black">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed font-bold text-muted-foreground">
          {body}
        </p>
      </div>
    </li>
  );
}
function Loading({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 p-5 text-sm font-bold text-muted-foreground"
    >
      <Loader2 className="size-5 shrink-0 animate-spin text-brand" />
      {children}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2">
      <span className="text-2xl font-black tabular-nums">{value}</span>
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </div>
  );
}
