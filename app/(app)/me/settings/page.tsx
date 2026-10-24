"use client";

import { Segmented } from "@/components/splash/segmented";
import { SwitchRow } from "@/components/kay/switch-row";
import { Eyebrow, Page, Panel } from "@/components/kay/ui";
import { DEFAULT_PREFS, prefsStore, usePrefs, type Prefs } from "@/lib/kay/store";

export default function Settings() {
  const prefs = usePrefs();
  return (
    <Page back="/me" title="Settings">
      <p className="text-muted-foreground">
        These are always free: they never cost activities or need badges.
      </p>

      <Panel className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">Seeing</h2>
        <div className="flex flex-col gap-2">
          <Eyebrow>Text size</Eyebrow>
          <Segmented<Prefs["text"]>
            name="text-size"
            value={prefs.text}
            onChange={(text) => prefsStore.set({ text })}
            options={[
              { value: "md", label: <><span className="text-sm" aria-hidden>Aa</span><span className="sr-only">Normal</span></> },
              { value: "lg", label: <><span className="text-base" aria-hidden>Aa</span><span className="sr-only">Large</span></> },
              { value: "xl", label: <><span className="text-xl" aria-hidden>Aa</span><span className="sr-only">Extra large</span></> },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Eyebrow>Theme</Eyebrow>
          <Segmented<Prefs["theme"]>
            name="theme"
            value={prefs.theme}
            onChange={(theme) => prefsStore.set({ theme })}
            options={[
              { value: "light", label: "☀️ Light" },
              { value: "dark", label: "🌙 Dark" },
            ]}
          />
        </div>
        <SwitchRow
          icon="◐"
          label="Higher contrast"
          hint="Stronger text and outlines"
          checked={prefs.contrast === "more"}
          onChange={(v) => prefsStore.set({ contrast: v ? "more" : "normal" })}
        />
        <SwitchRow
          icon="🐢"
          label="Reduce motion"
          hint="Stops bouncing, spinning and confetti"
          checked={prefs.motion === "reduce"}
          onChange={(v) => prefsStore.set({ motion: v ? "reduce" : "full" })}
        />
      </Panel>

      <Panel className="flex flex-col">
        <h2 className="font-heading text-xl font-semibold">Hearing &amp; listening</h2>
        <SwitchRow
          icon="💬"
          label="Captions"
          hint="On every animated explainer"
          checked={prefs.captions}
          onChange={(captions) => prefsStore.set({ captions })}
        />
        <SwitchRow
          icon="🔊"
          label="Voiceover"
          hint="Explainers read their captions aloud"
          checked={prefs.readAloud}
          onChange={(readAloud) => prefsStore.set({ readAloud })}
        />
        <p className="pt-2 text-sm text-muted-foreground">
          Every explainer also has a transcript and a written description of what&apos;s on screen.
        </p>
      </Panel>

      <button
        type="button"
        onClick={() => prefsStore.set(DEFAULT_PREFS)}
        className="self-center text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Reset to defaults
      </button>
    </Page>
  );
}
