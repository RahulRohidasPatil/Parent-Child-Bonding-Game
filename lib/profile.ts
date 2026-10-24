"use client";

import { useSyncExternalStore } from "react";
import { AVATAR_COLORS, type GameSettings, type Profile } from "@/lib/game/types";

const PROFILE_KEY = "splash.profile";
const HOSTED_KEY = "splash.hosted";

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedProfile: Profile | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(PROFILE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Profile | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as Profile) : null;
      cachedProfile =
        parsed && parsed.name && AVATAR_COLORS.includes(parsed.color) ? parsed : null;
    } catch {
      cachedProfile = null;
    }
  }
  return cachedProfile;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function saveProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Private mode etc. — the profile just won't persist.
  }
  listeners.forEach((l) => l());
}

/** The player's saved name/avatar. `null` on the server and before first save. */
export function useProfile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

const noop = () => () => {};
/** `false` during SSR + hydration, `true` once running in the browser. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Remember that this device created `code`, so the room opens as host. */
export function rememberHostedRoom(code: string, settings: GameSettings) {
  try {
    sessionStorage.setItem(HOSTED_KEY, JSON.stringify({ code, settings }));
  } catch {}
}

export function readHostedRoom(code: string): GameSettings | null {
  try {
    const raw = sessionStorage.getItem(HOSTED_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.code === code ? (parsed.settings as GameSettings) : null;
  } catch {
    return null;
  }
}

const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O — too easy to misread

export function makeRoomCode() {
  return Array.from(
    { length: 4 },
    () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)],
  ).join("");
}

export const normalizeCode = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
