"use client";

import { useEffect, useState } from "react";

export type User = {
  id: string;
  email: string | null;
  name: string;
  accountType: "parent" | "learner" | null;
  age: number | null;
  demo: boolean;
};

let cached: Promise<User | null> | null = null;

function fetchUser(): Promise<User | null> {
  cached ??= fetch("/api/auth/me", { cache: "no-store" })
    .then(async (r) => (r.ok ? ((await r.json()).user as User) : null))
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
