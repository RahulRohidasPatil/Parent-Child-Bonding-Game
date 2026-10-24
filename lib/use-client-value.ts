"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/**
 * A value that only exists in the browser (clock, URL, storage). The prerendered HTML uses
 * `server`; the browser swaps in `get()` after hydration. `get` must return a stable value
 * (a primitive, or the same object) between calls.
 */
export function useClientValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(noSubscribe, get, () => server);
}
