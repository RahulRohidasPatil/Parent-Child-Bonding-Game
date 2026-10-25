"use client";

import { useEffect } from "react";
import { homeApi } from "./home-api";

/**
 * Keep the store's copy of my home in step with the server while a screen is open, so a change
 * made in another window or device shows up here: on load, every few seconds while the page is
 * visible, and as soon as the window is focused again. `paused` holds off refreshing (e.g. while
 * furniture is being dragged) so the server's copy doesn't jump an item back mid-move.
 */
export function useLiveHome(paused = false, everyMs = 5000, onError?: (e: unknown) => void) {
  useEffect(() => {
    if (paused) return;
    let live = true;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      homeApi.mine().catch((e) => live && onError?.(e));
    };
    refresh();
    const timer = setInterval(refresh, everyMs);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
    // onError is a fresh function each render; the subscription only depends on these two.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, everyMs]);
}
