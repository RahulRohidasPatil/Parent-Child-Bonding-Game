"use client";

import { useState } from "react";
import { useClientValue } from "@/lib/use-client-value";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Face } from "@/components/qn/sprite";
import { AgeInput, SwitchRow } from "@/components/qn/learn-bits";
import { Card, PageHeader, Segmented } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/qn-data";
import { type Prefs, DEFAULT_PREFS, PREFS_KEY, applyPrefs } from "@/lib/prefs";
import { type QNState, setState, useQN } from "@/lib/store";
import { logout, useUser } from "@/lib/use-user";

function parsePrefs(raw: string): Prefs {
  try {
    return { ...DEFAULT_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return DEFAULT_PREFS;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="pl-1.5 text-xs font-black tracking-[.06em] text-muted-foreground uppercase">{title}</h2>
      <Card className="divide-y divide-[#eef2f4] overflow-hidden">{children}</Card>
    </section>
  );
}

export function SettingsScreen() {
  const { user } = useUser();
  const look = useQN((s) => s.look);
  const settings = useQN((s) => s.settings);
  const stored = useClientValue(() => {
    try {
      return localStorage.getItem(PREFS_KEY) ?? "";
    } catch {
      return "";
    }
  }, "");
  const [edited, setEdited] = useState<Prefs | null>(null);
  const prefs: Prefs = edited ?? parsePrefs(stored);

  const set = (patch: Partial<QNState["settings"]>) => setState((s) => ({ settings: { ...s.settings, ...patch } }));
  const setPref = (patch: Partial<Prefs>) => {
    const next = { ...prefs, ...patch };
    setEdited(next);
    applyPrefs(next);
  };

  return (
    <Page className="max-w-[1080px]">
      <PageHeader title="Settings" back={{ href: "/profile", label: "Back to profile" }} />
      <Card className="flex items-center gap-3 p-3.5">
        <Face id={look} size={52} tint={AVATARS.find((a) => a.id === look)?.tint} />
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="text-[17px] font-black">{user?.name ?? "…"}</span>
          <span className="truncate text-[13px] font-bold text-muted-foreground">
            {user?.accountType === "parent" ? "Parent account" : "Learner account"}
            {user?.email ? ` · ${user.email}` : ""}
          </span>
        </span>
        <Link href="/profile" className="text-sm font-black text-brand-ink">
          Edit
        </Link>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <Section title="Learning">
            <div className="flex flex-col gap-2.5 p-3.5">
              <span className="text-[15px] font-extrabold">Daily study goal</span>
              <Segmented
                label="Daily study goal"
                value={String(settings.goal) as "10" | "15" | "20"}
                onChange={(v) => set({ goal: Number(v) as 10 | 15 | 20 })}
                options={[{ value: "10", label: "10 min" }, { value: "15", label: "15 min" }, { value: "20", label: "20 min" }]}
              />
            </div>
            <div className="p-2">
              <AgeInput className="border-0" />
            </div>
            <SwitchRow label="Timers in games" note="Off means no rush on any question" checked={settings.timers} onChange={(v) => set({ timers: v })} />
          </Section>
          <Section title="Notifications">
            <SwitchRow label="Study reminder at 5 pm" checked={settings.remind} onChange={(v) => set({ remind: v })} />
            <SwitchRow label="Duel invites" checked={settings.duelInvites} onChange={(v) => set({ duelInvites: v })} />
            <SwitchRow label="Cheers on my base" checked={settings.cheers} onChange={(v) => set({ cheers: v })} />
          </Section>
        </div>
        <div className="flex flex-col gap-5">
          <Section title="Privacy">
            <div className="flex flex-col gap-2.5 p-3.5">
              <span className="text-[15px] font-extrabold">Who can visit my base</span>
              <Segmented
                label="Who can visit my base"
                value={settings.visit}
                onChange={(v) => set({ visit: v })}
                options={[{ value: "family", label: "Family" }, { value: "friends", label: "Friends" }, { value: "nobody", label: "Nobody" }]}
              />
              <span className="text-[13px] font-bold text-muted-foreground">Visitors can look and cheer. Only you can change things. New friends need a parent’s OK.</span>
            </div>
          </Section>
          <Section title="Accessibility">
            <div className="flex flex-col gap-2.5 p-3.5">
              <span className="text-[15px] font-extrabold">Text size</span>
              <Segmented
                label="Text size"
                value={prefs.text}
                onChange={(v) => setPref({ text: v })}
                options={[{ value: "md", label: "Normal" }, { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" }]}
              />
            </div>
            <SwitchRow label="More contrast" checked={prefs.contrast === "more"} onChange={(v) => setPref({ contrast: v ? "more" : "normal" })} />
            <SwitchRow label="Reduce motion" checked={prefs.motion === "reduce"} onChange={(v) => setPref({ motion: v ? "reduce" : "full" })} />
          </Section>
          <Button variant="soft" size="cta" onClick={logout} className="text-destructive">
            <LogOut /> Log out
          </Button>
        </div>
      </div>
      <p className="text-[13px] font-bold text-muted-foreground">These settings are saved in this browser.</p>
    </Page>
  );
}
