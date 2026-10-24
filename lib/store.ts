"use client";

import { useSyncExternalStore } from "react";
import type { AvatarId, PetId, Subject } from "./qn-data";
import { ROOMS, freshLevels, type RoomId, type RoomLayout } from "./home-data";

/**
 * Local prototype state for features the backend doesn't store yet (coins, looks, home,
 * quests, recent lessons). Lives in this browser only; the learning server keeps the
 * lessons, quizzes and decks themselves (in memory).
 */
export type RecentItem = {
  kind: "lesson" | "quiz" | "deck" | "material" | "duel";
  id: string;
  title: string;
  lessonId?: string;
  subject?: Subject;
  at: number;
  detail?: string;
};

export type QNState = {
  look: AvatarId;
  pet: PetId | null;
  owned: string[]; // looks and pets bought in the shop
  coins: number;
  streakDays: number;
  age: number | null;
  subject: Subject;
  prefersVisuals: boolean;
  recent: RecentItem[];
  progress: Record<string, number>; // quest id -> count
  claimed: string[];
  /** Built rooms, in build order: each item's level (0 = not placed yet) and where it was moved. */
  home: { rooms: Partial<Record<RoomId, number[]>>; layout: Partial<Record<RoomId, RoomLayout>> };
  settings: {
    goal: 10 | 15 | 20;
    timers: boolean;
    aloud: boolean;
    remind: boolean;
    duelInvites: boolean;
    cheers: boolean;
    visit: "family" | "friends" | "nobody";
  };
};

export const DEFAULT_STATE: QNState = {
  look: "nova",
  pet: "cat",
  owned: ["nova", "cat"],
  coins: 240,
  streakDays: 0,
  age: null,
  subject: "science",
  prefersVisuals: false,
  recent: [],
  progress: {},
  claimed: [],
  home: { rooms: { living: freshLevels(ROOMS[0]) }, layout: {} },
  settings: { goal: 15, timers: false, aloud: false, remind: true, duelInvites: true, cheers: false, visit: "friends" },
};

const KEY = "qn.state.v1";
let state: QNState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<QNState> & { base?: unknown };
      delete saved.base; // per-subject rooms from before the shared home
      state = {
        ...DEFAULT_STATE,
        ...saved,
        settings: { ...DEFAULT_STATE.settings, ...saved.settings },
        home: saved.home?.rooms?.living ? { layout: {}, ...saved.home } : DEFAULT_STATE.home,
      };
    }
  } catch {
    /* private mode or corrupt data: fall back to defaults */
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* best effort */
  }
}

export function getState(): QNState {
  load();
  return state;
}

export function setState(update: Partial<QNState> | ((s: QNState) => Partial<QNState>)) {
  load();
  const patch = typeof update === "function" ? update(state) : update;
  state = { ...state, ...patch };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Read the local store. Server render and first paint use defaults, then the saved state. */
export function useQN<T>(select: (s: QNState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(getState()),
    () => select(DEFAULT_STATE),
  );
}

// ---------- actions ----------

export function remember(item: Omit<RecentItem, "at">) {
  setState((s) => ({
    recent: [{ ...item, at: Date.now() }, ...s.recent.filter((r) => !(r.kind === item.kind && r.id === item.id))].slice(0, 30),
  }));
}

export function forget(kind: RecentItem["kind"], id: string) {
  setState((s) => ({ recent: s.recent.filter((r) => !(r.kind === kind && r.id === id)) }));
}

export function addCoins(n: number) {
  setState((s) => ({ coins: Math.max(0, s.coins + n) }));
}

/** Count progress toward quests; returns nothing (claiming is explicit on the Quests page). */
export function bump(questIds: string[], by = 1) {
  setState((s) => {
    const progress = { ...s.progress };
    questIds.forEach((id) => (progress[id] = (progress[id] ?? 0) + by));
    return { progress };
  });
}

export function markStudiedToday() {
  const today = new Date().toDateString();
  try {
    const last = localStorage.getItem("qn.lastStudy");
    if (last === today) return;
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    setState((s) => ({ streakDays: last === yesterday ? s.streakDays + 1 : 1 }));
    localStorage.setItem("qn.lastStudy", today);
  } catch {
    /* best effort */
  }
}
