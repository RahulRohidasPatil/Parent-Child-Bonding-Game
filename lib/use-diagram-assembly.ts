"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createDiagramApi,
  DiagramApiError,
  errorMessage,
  type Room,
  type Race,
  type Study,
  type Results,
  type Review,
  type Template,
  type RaceManagement,
} from "./diagram-api";
import { DiagramAttempt, type AttemptState } from "./diagram-attempt";
import { getRaceClock } from "./diagram-race-clock";
import { useClientValue } from "./use-client-value";

type SavedRoom = {
  roomId: string;
  templateId?: string;
  creatorRaceId?: string;
  creatingRace?: boolean;
  capturedUserIds?: string[];
};
const terminal = (status?: string) =>
  status === "finished" || status === "expired" || status === "cancelled";

export function useDiagramAssembly(playerId: string | undefined) {
  const api = useMemo(() => createDiagramApi(playerId ?? ""), [playerId]);
  const storageKey = "qn.diagram.room." + playerId;
  const storedRoom = useClientValue(() => {
    try {
      return sessionStorage.getItem(storageKey) ?? "null";
    } catch {
      return "null";
    }
  }, "null");
  const restored = useMemo(() => {
    try {
      const value = JSON.parse(storedRoom) as SavedRoom | null;
      return value && typeof value.roomId === "string" ? value : null;
    } catch {
      return null;
    }
  }, [storedRoom]);
  const [savedOverride, setSaved] = useState<SavedRoom | null | undefined>(
    undefined,
  );
  const saved = savedOverride === undefined ? restored : savedOverride;
  const booted = useClientValue(() => true, false) && !!playerId;
  const [room, setRoom] = useState<Room | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [study, setStudy] = useState<Study | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [management, setManagement] = useState<RaceManagement | null>(null);
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(0);
  const [refreshToken, setRefreshToken] = useState(0);
  const controller = useRef<DiagramAttempt | null>(null);
  const raceRef = useRef<Race | null>(null);
  const studyRef = useRef<Study | null>(null);
  const resultsRef = useRef<Results | null>(null);
  const savedRef = useRef<SavedRoom | null>(null);
  const actionLock = useRef(false);
  const sync = useRef<{ server: number; received: number } | null>(null);
  const mounted = useRef(true);
  const roomId = saved?.roomId;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.dispose();
    };
  }, []);

  const rememberRoom = useCallback(
    (value: SavedRoom | null) => {
      savedRef.current = value;
      setSaved(value);
      try {
        if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
        else sessionStorage.removeItem(storageKey);
      } catch {
        /* Resume is optional when storage is unavailable. */
      }
    },
    [storageKey],
  );

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  const syncClock = useCallback((serverNow: number) => {
    sync.current = { server: serverNow, received: performance.now() };
    setClockNow(serverNow);
  }, []);

  useEffect(() => {
    if (!race?.started_at || !race.deadline_at || terminal(race.status)) return;
    function tick() {
      if (sync.current)
        setClockNow(
          sync.current.server + performance.now() - sync.current.received,
        );
    }
    const timer = window.setInterval(tick, 200);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [race?.started_at, race?.deadline_at, race?.status]);

  const acceptRace = useCallback(
    (next: Race) => {
      if (raceRef.current?.id !== next.id) {
        controller.current?.dispose();
        controller.current = null;
        studyRef.current = null;
        resultsRef.current = null;
        setStudy(null);
        setResults(null);
        setReview(null);
        setReviewError(null);
        setAttempt(null);
        setManagement(null);
      }
      raceRef.current = next;
      setRace(next);
      syncClock(next.server_now);
      if (next.status !== "waiting") {
        studyRef.current = null;
        setStudy(null);
      }
      if (!next.source.available || next.status === "cancelled") {
        controller.current?.dispose();
        controller.current = null;
        setAttempt(null);
        setReview(null);
        setStudy(null);
        studyRef.current = null;
      }
      if (terminal(next.status)) {
        controller.current?.dispose();
      }
      if (next.status === "waiting" && savedRef.current?.creatingRace) {
        const recovered = {
          ...savedRef.current,
          creatingRace: false,
          creatorRaceId: next.id,
        };
        savedRef.current = recovered;
        setSaved(recovered);
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(recovered));
        } catch {
          /* optional */
        }
      }
    },
    [syncClock, storageKey],
  );

  useEffect(() => {
    if (!roomId || !playerId) return;
    const abort = new AbortController();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    async function poll() {
      let delay = document.hidden
        ? 15_000
        : terminal(raceRef.current?.status)
          ? 6000
          : 3000;
      try {
        const currentRoom = await api.room(roomId!, abort.signal);
        if (stopped) return;
        setRoom(currentRoom);
        let next: Race;
        try {
          next = await api.currentRace(roomId!, abort.signal);
        } catch (failure) {
          if (failure instanceof DiagramApiError && failure.status === 404) {
            // Late joiners may manage a round as host but cannot inspect participant content.
            if (currentRoom.host_id === playerId) {
              try {
                const info = await api.management(roomId!, abort.signal);
                if (!stopped) setManagement(info);
              } catch (managementError) {
                if (
                  !(
                    managementError instanceof DiagramApiError &&
                    managementError.status === 404
                  )
                )
                  throw managementError;
                if (!stopped) setManagement(null);
              }
            }
            if (!stopped) {
              setRace(null);
              raceRef.current = null;
              controller.current?.dispose();
              controller.current = null;
              setAttempt(null);
              setStudy(null);
              studyRef.current = null;
              setReview(null);
              setResults(null);
              resultsRef.current = null;
              setPollError(null);
            }
            return;
          }
          throw failure;
        }
        if (stopped) return;
        acceptRace(next);
        if (
          next.status === "waiting" &&
          next.source.available &&
          !studyRef.current
        ) {
          const reference = await api.study(next.id, abort.signal);
          if (!stopped) {
            studyRef.current = reference;
            setStudy(reference);
          }
        }
        if (
          (next.status === "countdown" || next.status === "running") &&
          next.source.available &&
          !controller.current
        ) {
          const board = await api.board(next.id, abort.signal);
          if (!stopped) {
            syncClock(board.server_now);
            const writer = new DiagramAttempt(board, api, (value) => {
              if (mounted.current) setAttempt(value);
            });
            controller.current = writer;
            setAttempt(writer.state);
          }
        }
        if (
          (next.status === "finished" || next.status === "expired") &&
          !resultsRef.current
        ) {
          const summary = await api.results(next.id, abort.signal);
          if (!stopped) {
            resultsRef.current = summary;
            setResults(summary);
          }
        }
        if (!stopped) {
          setPollError(null);
          failures = 0;
        }
      } catch (failure) {
        if (stopped || abort.signal.aborted) return;
        failures += 1;
        if (failure instanceof DiagramApiError && failure.status === 404) {
          setRoom(null);
          setRace(null);
          raceRef.current = null;
          controller.current?.dispose();
          controller.current = null;
          setAttempt(null);
          setStudy(null);
          studyRef.current = null;
          setReview(null);
        }
        setPollError(errorMessage(failure));
        delay = Math.max(
          Math.min(30_000, 3000 * 2 ** Math.min(failures, 4)),
          failure instanceof DiagramApiError ? failure.retryAfterMs : 0,
        );
        // Invalid-source and phase conflicts require a fresh lightweight snapshot.
      } finally {
        if (!stopped) timer = setTimeout(poll, delay);
      }
    }
    void poll();
    function reconnect() {
      if (document.hidden) return;
      // The current polling request is allowed to finish; no overlapping polling loops.
      setRefreshToken((value) => value + 1);
    }
    window.addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", reconnect);
    return () => {
      stopped = true;
      abort.abort();
      clearTimeout(timer);
      window.removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", reconnect);
    };
  }, [api, roomId, playerId, refreshToken, acceptRace, syncClock]);

  // Save semantic drops, never pointer movement; at most one write per second.
  useEffect(() => {
    if (
      !attempt?.dirty ||
      attempt.saving ||
      attempt.error ||
      (race?.status !== "running" && race?.status !== "countdown")
    )
      return;
    const timer = setTimeout(() => {
      void controller.current?.flush().catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [attempt, race?.status]);

  function refresh() {
    setRefreshToken((value) => value + 1);
  }

  async function run(label: string, action: () => Promise<void>) {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(label);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(errorMessage(failure));
      if (failure instanceof DiagramApiError && failure.status === 409) {
        if (
          (label === "Checking diagram" || label === "Ending attempt") &&
          controller.current
        ) {
          try {
            const latest = await api.board(controller.current.state.board.id);
            controller.current?.reload(latest);
          } catch {
            /* The snapshot refresh handles terminal or unavailable boards. */
          }
        }
        refresh();
      }
    } finally {
      actionLock.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  function forgetRoom() {
    controller.current?.dispose();
    controller.current = null;
    rememberRoom(null);
    setRoom(null);
    setRace(null);
    raceRef.current = null;
    setStudy(null);
    studyRef.current = null;
    setResults(null);
    resultsRef.current = null;
    setReview(null);
    setAttempt(null);
    setManagement(null);
    setError(null);
    setPollError(null);
    setPollError(null);
  }

  const clock =
    race?.started_at != null && race.deadline_at != null
      ? getRaceClock(
          { startedAt: race.started_at, deadlineAt: race.deadline_at },
          clockNow,
        )
      : null;
  const me = race?.players.find((player) => player.id === race.my_player_id);
  const playable =
    (race?.status === "running" || race?.status === "countdown") &&
    !!clock?.started &&
    !clock.expired &&
    !!race.source.available &&
    !pollError &&
    !me?.completed &&
    !me?.forfeited &&
    !attempt?.lastAction?.completed &&
    !attempt?.lastAction?.forfeited;

  return {
    api,
    booted,
    saved,
    room,
    race,
    study,
    results,
    review,
    management,
    attempt,
    template,
    busy,
    error: error ?? pollError,
    reviewError,
    clock,
    playable,
    me,
    refresh,
    dismissError: () => {
      setError(null);
      setPollError(null);
    },
    forgetRoom,
    createRoom: (lessonId: string, visualId: string, displayName: string) =>
      run("Preparing your diagram", async () => {
        const frozen = await api.prepare(lessonId, visualId);
        setTemplate(frozen);
        const created = await api.createRoom(displayName);
        setRoom(created);
        rememberRoom({ roomId: created.id, templateId: frozen.id });
      }),
    join: (code: string, displayName: string) =>
      run("Joining room", async () => {
        const joined = await api.join(code.trim().toUpperCase(), displayName);
        setRoom(joined);
        rememberRoom({ roomId: joined.id });
      }),
    prepare: (lessonId: string, visualId: string) =>
      run("Preparing your diagram", async () => {
        const frozen = await api.prepare(lessonId, visualId);
        setTemplate(frozen);
        if (savedRef.current)
          rememberRoom({ ...savedRef.current, templateId: frozen.id });
      }),
    createRace: () =>
      run("Creating round", async () => {
        const current = await api.room(room!.id);
        rememberRoom({
          ...savedRef.current!,
          creatingRace: true,
          capturedUserIds: current.members.map((member) => member.user_id),
        });
        const created = await api.createRace(
          current.id,
          savedRef.current!.templateId!,
          current.version,
        );
        rememberRoom({
          ...savedRef.current!,
          creatingRace: false,
          creatorRaceId: created.id,
        });
        acceptRace(await api.race(created.id));
        refresh();
      }),
    ready: () =>
      run("Updating readiness", async () => {
        const updated = await api.roomCommand(
          room!.id,
          room!.version,
          "ready",
          !room!.members.find((member) => member.user_id === playerId)?.ready,
        );
        if ("id" in updated) setRoom(updated);
        refresh();
      }),
    start: () =>
      run("Starting round", async () => {
        await api.start(race!.id, race!.version);
        acceptRace(await api.race(race!.id));
        refresh();
      }),
    place: (slotId: string, cardId: string | null) => {
      if (playable && !busy) controller.current?.place(slotId, cardId);
    },
    retrySave: () =>
      run("Saving placements", async () => {
        await controller.current?.flush();
      }),
    finish: () =>
      run("Checking diagram", async () => {
        const writer = controller.current;
        if (!writer || !playable) return;
        writer.acknowledge();
        await writer.flush();
        if (writer.state.dirty || writer.state.error)
          throw new Error(writer.state.error || "Save your placements first.");
        const result = await api.finish(
          writer.state.board.id,
          writer.state.board.version,
        );
        writer.applyAction(result);
        acceptRace(await api.race(writer.state.board.id));
        refresh();
      }),
    forfeit: () =>
      run("Ending attempt", async () => {
        const writer = controller.current;
        if (!writer) return;
        await writer.flush();
        const result = await api.forfeit(
          writer.state.board.id,
          writer.state.board.version,
        );
        writer.applyAction(result);
        acceptRace(await api.race(writer.state.board.id));
        refresh();
      }),
    cancel: () =>
      run("Cancelling round", async () => {
        const target = race
          ? { id: race.id, version: race.version }
          : management
            ? { id: management.race_id, version: management.version }
            : null;
        if (target) await api.cancel(target.id, target.version);
        refresh();
      }),
    leave: () =>
      run("Leaving room", async () => {
        await api.roomCommand(room!.id, room!.version, "leave");
        forgetRoom();
      }),
    loadReview: () =>
      run("Loading solution", async () => {
        setReviewError(null);
        try {
          setReview(await api.review(race!.id));
        } catch (failure) {
          setReviewError(errorMessage(failure));
        }
      }),
  };
}
