"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/splash/back-link";
import { CodeInput } from "@/components/splash/code-input";
import { EMPTY_PROFILE, isProfileValid, ProfilePicker } from "@/components/splash/profile-form";
import { Eyebrow, Screen } from "@/components/splash/screen";
import type { Profile } from "@/lib/game/types";
import { saveProfile, useProfile } from "@/lib/profile";

export default function JoinPage() {
  const router = useRouter();
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile | null>(null);
  const profile = draft ?? saved ?? EMPTY_PROFILE;
  const [code, setCode] = useState("");
  const codeReady = code.length === 4;

  const join = () => {
    saveProfile({ ...profile, name: profile.name.trim() });
    router.push(`/splash/room/${code}`);
  };

  return (
    <Screen
      top={
        <>
          <BackLink href="/splash" />
          <span className="font-heading text-lg font-semibold">Join a game</span>
          <span className="size-11" />
        </>
      }
      footer={
        <Button
          variant="sun"
          size="game"
          className="w-full"
          disabled={!codeReady || !isProfileValid(profile)}
          onClick={join}
        >
          <DoorOpen /> {codeReady ? `Join room ${code}` : "Enter the room code"}
        </Button>
      }
    >
      <form
        className="flex flex-col gap-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (codeReady && isProfileValid(profile)) join();
        }}
      >
        <section className="flex flex-col gap-3 animate-rise">
          <h1 className="text-3xl font-semibold">What&apos;s the code?</h1>
          <p className="text-muted-foreground">It&apos;s the 4 letters on the host&apos;s screen.</p>
          <CodeInput value={code} onChange={setCode} autoFocus />
        </section>

        {codeReady && (
          <section className="flex flex-col gap-3 animate-rise">
            <Eyebrow>Who&apos;s playing?</Eyebrow>
            <ProfilePicker saved={saved} value={profile} onChange={setDraft} />
          </section>
        )}
        <button type="submit" hidden />
      </form>
    </Screen>
  );
}
