"use client";

import Link from "next/link";
import { Lock, Settings } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Sprite, Stage } from "@/components/qn/sprite";
import { Card, PageHeader, StatChips } from "@/components/qn/ui";
import { SwitchRow } from "@/components/qn/learn-bits";
import { buttonVariants } from "@/components/ui/button";
import { AVATARS } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";

export function ProfileScreen() {
  const { user } = useUser();
  const look = useQN((s) => s.look);
  const pet = useQN((s) => s.pet);
  const owned = useQN((s) => s.owned);

  return (
    <Page>
      <PageHeader
        title="My look"
        sub={user ? `${user.name} · ${user.accountType === "parent" ? "Parent" : "Student"}` : undefined}
        right={
          <Link href="/settings" aria-label="Settings" className="flex size-11 items-center justify-center rounded-full border border-line bg-card hover:bg-muted">
            <Settings className="size-5" />
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start">
        <Stage className="h-[320px] md:h-[440px]">
          <div className="absolute bottom-6 left-1/2 h-6 w-[220px] -translate-x-1/2 rounded-[50%] bg-stage-floor" />
          <Sprite id={look} alt="Your avatar preview" className="absolute bottom-6 left-1/2 w-[256px] -translate-x-1/2 md:w-[280px] lg:w-[340px]" />
          {pet && <Sprite id="cat" className="absolute bottom-6 left-[calc(50%+76px)] w-14 lg:left-[calc(50%+120px)] lg:w-[72px]" />}
          <StatChips className="absolute top-4 left-4" />
        </Stage>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[17px] font-black">Pick your look</span>
            <div role="radiogroup" aria-label="Look" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {AVATARS.map((a) => {
                const has = owned.includes(a.id);
                const on = look === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={has ? a.label : `${a.label} (in the shop)`}
                    disabled={!has}
                    onClick={() => setState({ look: a.id })}
                    className={cn("relative flex h-[104px] items-end justify-center overflow-hidden rounded-2xl", on ? "ring-3 ring-brand" : "ring-1 ring-line", !has && "opacity-50")}
                    style={{ background: a.tint }}
                  >
                    <Sprite id={a.id} className="w-[104px]" />
                    {!has && <Lock className="absolute top-2 right-2 size-4" />}
                  </button>
                );
              })}
            </div>
            <Link href="/shop" className="text-sm font-black text-brand-ink">
              Get more looks in the shop
            </Link>
          </Card>
          <Card className="overflow-hidden">
            <SwitchRow label="Bring Mochi along" note="Your cat shows up next to you" checked={!!pet} onChange={(v) => setState({ pet: v ? "cat" : null })} />
          </Card>
          <Link href="/home" className={cn(buttonVariants({ variant: "brand", size: "cta" }))}>
            Save my look
          </Link>
          <span className="text-center text-[13px] font-bold text-muted-foreground">Family and friends see this look when they visit.</span>
        </div>
      </div>
    </Page>
  );
}
