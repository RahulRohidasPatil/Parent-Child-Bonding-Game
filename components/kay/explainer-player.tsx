"use client";

import { useEffect, useState } from "react";
import { Captions, CaptionsOff, FileText, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { LearningBlock } from "@/lib/kay/content";
import { prefsStore, usePrefs } from "@/lib/kay/store";
import { speak, stopSpeaking } from "@/lib/kay/speech";
import { cn } from "@/lib/utils";
import { PixelScene } from "./pixel-scene";

const LINE_SECONDS = 4;

/** Animated explainer with captions, transcript, voiceover and a text description. */
export function ExplainerPlayer({ block }: { block: LearningBlock }) {
  const prefs = usePrefs();
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const duration = block.captions[block.captions.length - 1].at + LINE_SECONDS;
  const ended = t >= duration;
  const active = playing && !ended;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setT((prev) => Math.min(duration, prev + 0.25)), 250);
    return () => clearInterval(id);
  }, [active, duration]);

  const index = Math.max(0, block.captions.findLastIndex((c) => c.at <= t));
  const caption = block.captions[index];

  // Voiceover: speak each caption as it appears.
  useEffect(() => {
    if (active && prefs.readAloud) speak(caption.text);
  }, [active, prefs.readAloud, caption.text]);
  useEffect(() => {
    if (!active) stopSpeaking();
  }, [active]);
  useEffect(() => stopSpeaking, []);

  const toggle = () => {
    if (ended) {
      setT(0);
      setPlaying(true);
    } else setPlaying(!playing);
  };

  return (
    <section aria-label={`Animated explainer: ${block.title}`} className="overflow-hidden rounded-3xl border bg-card">
      <div className="relative">
        <PixelScene scene={block.scene} playing={active} />
        {prefs.captions && t > 0 && (
          <p
            className="absolute inset-x-3 bottom-3 rounded-xl bg-black/75 px-3 py-2 text-center text-base font-semibold text-white"
            aria-live="polite"
          >
            {caption.text}
          </p>
        )}
        {!active && t === 0 && (
          <button
            type="button"
            onClick={toggle}
            className="absolute inset-0 grid place-items-center bg-black/25 focus-visible:outline-none"
            aria-label="Play explainer"
          >
            <span className="grid size-16 place-items-center rounded-full bg-sun text-ink shadow-lg">
              <Play className="size-7 translate-x-0.5" aria-hidden />
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 border-t p-2">
        <ControlButton label={active ? "Pause" : ended ? "Replay" : "Play"} onClick={toggle}>
          {active ? <Pause /> : ended ? <RotateCcw /> : <Play />}
        </ControlButton>
        <div
          className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Playback position"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(t)}
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${(t / duration) * 100}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-bold tabular-nums text-muted-foreground" aria-hidden>
          0:{String(Math.floor(t)).padStart(2, "0")}
        </span>
        <ControlButton
          label={prefs.captions ? "Turn captions off" : "Turn captions on"}
          pressed={prefs.captions}
          onClick={() => prefsStore.set({ captions: !prefs.captions })}
        >
          {prefs.captions ? <Captions /> : <CaptionsOff />}
        </ControlButton>
        <ControlButton
          label={prefs.readAloud ? "Turn voiceover off" : "Turn voiceover on"}
          pressed={prefs.readAloud}
          onClick={() => prefsStore.set({ readAloud: !prefs.readAloud })}
        >
          {prefs.readAloud ? <Volume2 /> : <VolumeX />}
        </ControlButton>
        <ControlButton label="Transcript" pressed={showTranscript} onClick={() => setShowTranscript(!showTranscript)}>
          <FileText />
        </ControlButton>
      </div>

      {showTranscript && (
        <div className="border-t bg-muted/50 p-4 text-sm">
          <p className="mb-2 font-bold">What you see</p>
          <p className="mb-3 text-muted-foreground">{block.sceneDescription}</p>
          <p className="mb-2 font-bold">What Kay says</p>
          <ol className="flex flex-col gap-1.5">
            {block.captions.map((c, i) => (
              <li key={c.at} className={cn("flex gap-2", i === index && t > 0 && "font-bold")}>
                <span className="w-9 shrink-0 tabular-nums text-muted-foreground">0:{String(c.at).padStart(2, "0")}</span>
                {c.text}
              </li>
            ))}
          </ol>
        </div>
      )}
      {/* Always available to screen readers, whether or not the transcript is open */}
      {!showTranscript && <p className="sr-only">{block.sceneDescription}</p>}
    </section>
  );
}

function ControlButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "grid size-10 place-items-center rounded-xl text-foreground transition hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&_svg]:size-5",
        pressed && "bg-accent",
      )}
    >
      {children}
    </button>
  );
}
