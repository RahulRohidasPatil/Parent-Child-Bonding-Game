"use client";

import { useState } from "react";
import Link from "next/link";
import { DoorOpen, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Blob } from "@/components/splash/blob";
import { EMPTY_PROFILE, isProfileValid, ProfileFields } from "@/components/splash/profile-form";
import { Screen } from "@/components/splash/screen";
import { useMockRoom } from "@/lib/game/mock-room";
import type { Profile } from "@/lib/game/types";
import { readHostedRoom, saveProfile, useHydrated, useProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { DevPanel } from "./dev-panel";
import { ClueRound } from "./phases/clues";
import { Discussion } from "./phases/discuss";
import { Lobby } from "./phases/lobby";
import { Reveal } from "./phases/reveal";
import { RoundResult } from "./phases/result";
import { Scoreboard } from "./phases/scoreboard";
import { Vote } from "./phases/vote";

export function RoomLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Blob color="sun" mood="sleepy" size={72} className="animate-float" />
      <p className="font-heading text-lg text-muted-foreground">Opening room…</p>
    </div>
  );
}

export function GameRoom({ code }: { code: string }) {
  const hydrated = useHydrated();
  const profile = useProfile();
  if (!hydrated) return <RoomLoading />;
  if (!profile) return <JoinFromLink code={code} />;
  return <Room code={code} profile={profile} />;
}

/** Someone opened a shared room link without a profile on this device. */
function JoinFromLink({ code }: { code: string }) {
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  return (
    <Screen
      top={
        <>
          <span className="font-heading text-lg font-semibold">Joining room {code}</span>
          <LeaveButton />
        </>
      }
      footer={
        <Button
          variant="sun"
          size="game"
          className="w-full"
          disabled={!isProfileValid(draft)}
          onClick={() => saveProfile({ ...draft, name: draft.name.trim() })}
        >
          <DoorOpen /> Join the game
        </Button>
      }
    >
      <ProfileFields value={draft} onChange={setDraft} />
    </Screen>
  );
}

function Room({ code, profile }: { code: string; profile: Profile }) {
  const [hostSettings] = useState(() => readHostedRoom(code));
  const room = useMockRoom({ code, profile, hostSettings });
  const { phase, round, settings } = room.state;

  const top = (
    <>
      <LeaveButton />
      <div className="flex items-center gap-2">
        {round > 0 && phase !== "scoreboard" && (
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-sm font-bold">
            Round {round}/{settings.rounds}
          </span>
        )}
        <span className="rounded-full bg-white/8 px-3 py-1.5 font-mono text-sm font-bold tracking-[0.2em]">
          {code}
        </span>
      </div>
    </>
  );

  const screens = {
    lobby: Lobby,
    reveal: Reveal,
    clues: ClueRound,
    discuss: Discussion,
    vote: Vote,
    result: RoundResult,
    scoreboard: Scoreboard,
  } as const;
  const Phase = screens[phase];

  return (
    <>
      {/* key: fresh local UI state (selections, peeks) whenever the phase or round changes */}
      <Phase key={`${phase}-${round}`} room={room} top={top} />
      <DevPanel room={room} />
    </>
  );
}

function LeaveButton() {
  return (
    <Link
      href="/splash"
      aria-label="Leave room"
      className={cn(buttonVariants({ variant: "glass", size: "icon-lg" }), "size-11 rounded-full")}
    >
      <X className="size-5" />
    </Link>
  );
}
