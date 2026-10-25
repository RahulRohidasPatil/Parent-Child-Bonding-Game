"use client";

import { useEffect, useState } from "react";
import { setAccount } from "./store";

export type User = {
  id: string;
  email: string | null;
  name: string;
  accountType: "parent" | "learner" | null;
  age: number | null;
  demo: boolean;
};

let cached: Promise<User | null> | null = null;
const SESSION_KEY = "qn.session"; // the account this tab has already started a session for

/**
 * Start the app session for the signed-in account: the server gives the account its own
 * learning-service player and tells the service its name and role, and local state switches to
 * this account. Safe to call again. `learning` is false if the learning service couldn't be reached.
 */
export async function startSession(): Promise<{ user: User; learning: boolean } | null> {
  // Server side: app/api/auth/[action]/route.ts and lib/server/learning-session.ts (docs/SESSION.md).
  try {
    const r = await fetch("/api/auth/session", { method: "POST", cache: "no-store" });
    if (!r.ok) return null;
    const body = (await r.json()) as { user: User; learning: boolean; refreshToken: boolean };
    if (body.refreshToken) {
      // A new player id only reaches the Clerk session token on its next refresh; do it now.
      const clerk = (window as { Clerk?: { session?: { getToken(o: { skipCache: boolean }): Promise<unknown> } | null } }).Clerk;
      await clerk?.session?.getToken({ skipCache: true }).catch(() => undefined);
    }
    setAccount(body.user.id);
    try {
      sessionStorage.setItem(SESSION_KEY, body.user.id);
    } catch {
      /* fine: the session just starts again next time */
    }
    cached = Promise.resolve(body.user);
    return body;
  } catch {
    return null;
  }
}

function fetchUser(): Promise<User | null> {
  cached ??= fetch("/api/auth/me", { cache: "no-store" })
    .then(async (r) => (r.ok ? ((await r.json()).user as User) : null))
    .then((user) => {
      if (user) {
        setAccount(user.id);
        // Sign-up by email link and older logins land here without passing the login form.
        let started: string | null = null;
        try {
          started = sessionStorage.getItem(SESSION_KEY);
        } catch {
          /* treat as not started */
        }
        if (started !== user.id) void startSession();
      }
      return user;
    })
    .catch(() => null);
  return cached;
}

export function resetUserCache() {
  cached = null;
}

/** The signed-in user (display data only; tokens stay in httpOnly cookies). */
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetchUser().then((u) => {
      if (!live) return;
      setUser(u);
      setLoading(false);
      if (!u) {
        resetUserCache();
        window.location.assign(new URL(`/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin));
      }
    });
    return () => {
      live = false;
    };
  }, []);
  return { user, loading };
}

export async function logout(signOut?: () => Promise<void>) {
  if (signOut) {
    await signOut();
  }
  resetUserCache();
  try {
    sessionStorage.clear();
  } catch {
    /* fine */
  }
  window.location.assign(new URL("/login", window.location.origin));
}
