"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/splash/back-link";
import { EMPTY_PROFILE, isProfileValid, ProfilePicker } from "@/components/splash/profile-form";
import { Card, Eyebrow, Screen } from "@/components/splash/screen";
import { Segmented } from "@/components/splash/segmented";
import { DEFAULT_SETTINGS } from "@/lib/game/mock-room";
import { PACKS } from "@/lib/game/packs";
import type { GameSettings, Profile } from "@/lib/game/types";
import { makeRoomCode, rememberHostedRoom, saveProfile, useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export default function HostPage() {
  const router = useRouter();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const profile = draft ?? saved ?? EMPTY_PROFILE;
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [step, setStep] = useState<"you" | "game">("you");

  const create = () => {
    saveProfile({ ...profile, name: profile.name.trim() });
    const code = makeRoomCode();
    rememberHostedRoom(code, settings);
    router.push(`/splash/room/${code}`);
  };

  return (
    <Screen
      top={
        <>
          {step === "you" ? (
            <BackLink href="/splash" />
          ) : (
            <Button variant="glass" size="icon-lg" className="size-11 rounded-full" onClick={() => setStep("you")} aria-label="Back">
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <StepDots step={step === "you" ? 0 : 1} />
          <span className="size-11" />
        </>
      }
      footer={
        step === "you" ? (
          <Button
            variant="sun"
            size="game"
            className="w-full"
            disabled={!isProfileValid(profile)}
            onClick={() => setStep("game")}
          >
            Next: game setup <ArrowRight />
          </Button>
        ) : (
          <Button variant="sun" size="game" className="w-full" onClick={create}>
            <Sparkles /> Create room
          </Button>
        )
      }
    >
      {step === "you" ? (
        <div key="you" className="flex flex-col gap-6 animate-rise">
          <h1 className="text-center text-3xl font-semibold">Who&apos;s hosting?</h1>
          <ProfilePicker saved={saved} value={profile} onChange={setDraft} />
        </div>
      ) : (
        <div key="game" className="flex flex-col gap-6 animate-rise">
          <h1 className="text-center text-3xl font-semibold">Set up the game</h1>

          <section className="flex flex-col gap-3">
            <Eyebrow>Word pack</Eyebrow>
            <div className="grid grid-cols-2 gap-2.5">
              {PACKS.map((pack) => {
                const selected = settings.packId === pack.id;
                return (
                  <label
                    key={pack.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-white/8 bg-white/5 p-3 transition",
                      "has-focus-visible:ring-3 has-focus-visible:ring-ring/60",
                      selected && "border-sun bg-sun/10",
                    )}
                  >
                    <input
                      type="radio"
                      name="pack"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setSettings({ ...settings, packId: pack.id })}
                    />
                    <span className="text-3xl" aria-hidden>
                      {pack.emoji}
                    </span>
                    <span className="font-heading text-lg font-semibold">{pack.name}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Eyebrow>Rounds</Eyebrow>
            <Segmented
              name="rounds"
              value={settings.rounds}
              onChange={(rounds) => setSettings({ ...settings, rounds })}
              options={[1, 3, 5].map((n) => ({ value: n, label: n }))}
            />
          </section>

          <section className="flex flex-col gap-3">
            <Eyebrow>Chat time before voting</Eyebrow>
            <Segmented
              name="discuss"
              value={settings.discussSeconds}
              onChange={(discussSeconds) => setSettings({ ...settings, discussSeconds })}
              options={[30, 60, 90].map((n) => ({ value: n, label: `${n}s` }))}
            />
          </section>

          <Card className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
            <span className="text-2xl" aria-hidden>
              💡
            </span>
            <p>
              First time? Pick <strong className="text-foreground">Animals</strong> and{" "}
              <strong className="text-foreground">60s</strong>: easy for little ones, still tricky for grown-ups.
            </p>
          </Card>
        </div>
      )}
    </Screen>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step + 1} of 2`}>
      {[0, 1].map((i) => (
        <span
          key={i}
          className={cn("h-2.5 rounded-full bg-white/20 transition-all", i === step ? "w-8 bg-sun" : "w-2.5")}
        />
      ))}
    </div>
  );
}
