"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lesson visuals arrive as complete HTML pages. They run in a sandboxed iframe
 * (scripts allowed, no access to this page) and report their height via postMessage
 * `{ type: "visual-height", height }`, same contract as the learning service's own page.
 */
export function VisualFrame({ html, title, className, minHeight = 160 }: { html: string; title: string; className?: string; minHeight?: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || e.data.type !== "visual-height" || e.source !== ref.current?.contentWindow) return;
      setHeight(Math.min(Math.max(Number(e.data.height) || 0, minHeight), 900));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight]);
  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-scripts"
      srcDoc={html}
      className={cn("w-full rounded-2xl border border-line bg-white", className)}
      style={{ height }}
    />
  );
}
