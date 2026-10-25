"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { tintOf } from "@/components/qn/duel";
import { Sheet } from "@/components/qn/sheet";
import { Face } from "@/components/qn/sprite";
import { Notice } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { type Duel, SocialError, msUntil, socialApi } from "@/lib/social-api";
import { useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";

/**
 * Keeps the signed-in user "online" for friends (heartbeat while the app is open) and shows duel
 * invites from any page. Mounted once in the app shell.
 */
export function Presence() {
  const router = useRouter();
  const { user } = useUser();
  const look = useQN((s) => s.look);
  const [invite, setInvite] = useState<{ duel: Duel; at: number } | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dismissed = useRef(new Set<string>());

  // Profile first (search and presence only know users who saved one), then the heartbeat.
  useEffect(() => {
    if (!user) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const beat = async () => {
      if (!live) return;
      let every = 20;
      if (document.visibilityState === "visible") {
        try {
          const p = await socialApi.presence();
          every = p.heartbeat_s;
          const next = p.invites.find((d) => !dismissed.current.has(d.id));
          if (live) setInvite((cur) => (next ? (cur?.duel.id === next.id ? cur : { duel: next, at: Date.now() }) : null));
        } catch {
          /* try again on the next beat */
        }
      }
      if (live) timer = setTimeout(beat, every * 1000);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      beat();
    };
    socialApi
      .saveMe({ display_name: user.name, avatar: look, role: user.accountType === "parent" ? "parent" : "learner" })
      .catch(() => undefined)
      .finally(beat);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pagehide", socialApi.leave);
    return () => {
      live = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pagehide", socialApi.leave);
    };
  }, [user, look]);

  // Countdown on the invite; it closes itself when time runs out.
  useEffect(() => {
    if (!invite) return;
    const tick = () => {
      const s = Math.ceil(msUntil(invite.duel.invite_expires_at, invite.duel, invite.at) / 1000);
      setLeft(Math.max(0, s));
      if (s <= 0) setInvite(null);
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [invite]);

  if (!invite) return null;
  const { duel } = invite;
  const from = duel.challenger;

  function close() {
    dismissed.current.add(duel.id);
    setInvite(null);
    setError(null);
  }

  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (accept) {
        await socialApi.acceptDuel(duel.id);
        close();
        router.push(`/play/challenge/${duel.id}`);
      } else {
        await socialApi.declineDuel(duel.id);
        close();
      }
    } catch (e) {
      setError(e instanceof SocialError ? e.message : "Couldn’t answer the invite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open onClose={close} title="Duel invite" sub={`${left}s to answer`}>
      <div className="flex items-center gap-3">
        <Face id={from.avatar} size={56} tint={tintOf(from.avatar)} />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-[18px] font-black">{from.display_name} challenges you!</span>
          <span className="text-[14px] font-bold text-muted-foreground">
            {duel.num_questions} questions on {duel.lesson_title}. You both play at the same time.
          </span>
        </span>
      </div>
      {error && <Notice>{error}</Notice>}
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="soft" size="cta" disabled={busy} onClick={() => answer(false)}>
          Not now
        </Button>
        <Button variant="brand" size="cta" disabled={busy} onClick={() => answer(true)}>
          <Swords /> Play
        </Button>
      </div>
    </Sheet>
  );
}
