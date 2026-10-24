"use client";

/**
 * Tiny localStorage-backed stores for the UI prototype: the signed-in
 * person (from onboarding) and accessibility preferences. Both will move to
 * Supabase (profiles / user_preferences) — keep the shapes.
 */

import { useSyncExternalStore } from "react";
import { DEMO_ME, DEMO_PARTNER, DEMO_TEAM_NAME, type Person } from "./data";

function createStore<T>(key: string, fallback: T, onChange?: (value: T) => void) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cached: T = fallback;

  const read = (): T => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {}
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
      } catch {
        cached = fallback;
      }
    }
    return cached;
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    window.addEventListener("storage", l);
    return () => {
      listeners.delete(l);
      window.removeEventListener("storage", l);
    };
  };

  const set = (patch: Partial<T>) => {
    const next = { ...read(), ...patch };
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
    onChange?.(next);
    listeners.forEach((l) => l());
  };

  const use = () => useSyncExternalStore(subscribe, read, () => fallback);
  return { use, set, read };
}

// ---------------------------------------------------------------------------

export type Session = {
  me: Person;
  partner: Person | null;
  teamName: string | null;
  dailyGoal: number;
};

const DEFAULT_SESSION: Session = {
  me: DEMO_ME,
  partner: DEMO_PARTNER,
  teamName: DEMO_TEAM_NAME,
  dailyGoal: 15,
};

export const sessionStore = createStore<Session>("kay.session", DEFAULT_SESSION);
export const useSession = sessionStore.use;

// ---------------------------------------------------------------------------

export type Prefs = {
  theme: "light" | "dark";
  text: "md" | "lg" | "xl";
  contrast: "normal" | "more";
  motion: "full" | "reduce";
  captions: boolean;
  readAloud: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  text: "md",
  contrast: "normal",
  motion: "full",
  captions: true,
  readAloud: false,
};

import { PREFS_KEY } from "./prefs-boot";

function applyPrefs(p: Prefs) {
  const el = document.documentElement;
  el.dataset.theme = p.theme;
  el.dataset.text = p.text;
  el.dataset.contrast = p.contrast;
  el.dataset.motion = p.motion;
}

export const prefsStore = createStore<Prefs>(PREFS_KEY, DEFAULT_PREFS, applyPrefs);
export const usePrefs = prefsStore.use;
