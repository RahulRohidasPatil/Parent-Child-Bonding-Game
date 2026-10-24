"use client";

import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Eyebrow, Page, Pill } from "@/components/kay/ui";
import { AVATAR_COLORS } from "@/lib/game/types";
import { ITEMS, TODAY, type Accessory } from "@/lib/kay/data";
import { sessionStore, useSession } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

export default function AvatarStudio() {
  const session = useSession();
  const [points, setPoints] = useState(TODAY.points);
  const [owned, setOwned] = useState<Accessory[]>(ITEMS.filter((i) => i.owned).map((i) => i.id));
  const [preview, setPreview] = useState<Accessory | null>(null);
  const shown = preview ?? session.me.accessory;
  const item = ITEMS.find((i) => i.id === shown)!;
  const isOwned = owned.includes(shown);
  const equipped = session.me.accessory === shown;

  const equip = () => sessionStore.set({ me: { ...session.me, accessory: shown } });
  const buy = () => {
    setPoints((p) => p - item.cost);
    setOwned((o) => [...o, item.id]);
    equip();
  };

  return (
    <Page
      back="/rewards"
      title="Avatar"
      actions={<Pill tone="sun" className="py-1 text-sm">🪙 {points}</Pill>}
      footer={
        isOwned ? (
          <Button variant={equipped ? "glass" : "default"} size="game" className="w-full disabled:opacity-100" disabled={equipped} onClick={equip}>
            {equipped ? (
              <>
                <Check /> Wearing it
              </>
            ) : (
              `Wear ${item.name}`
            )}
          </Button>
        ) : (
          <Button variant="sun" size="game" className="w-full" disabled={points < item.cost} onClick={buy}>
            {points < item.cost ? `Need ${item.cost - points} more points` : `Buy for ${item.cost} points`}
          </Button>
        )
      }
    >
      <div className="flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-b from-sky/25 to-transparent py-6">
        <Avatar person={{ ...session.me, accessory: shown }} size={160} className="animate-float" />
        <p className="font-heading text-2xl font-semibold">{session.me.name}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">
          <Eyebrow>Colour</Eyebrow>
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATAR_COLORS.map((c) => (
            <label
              key={c}
              className={cn(
                "grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 bg-card",
                "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                session.me.color === c && "border-primary",
              )}
            >
              <input
                type="radio"
                name="color"
                className="sr-only"
                aria-label={c}
                checked={session.me.color === c}
                onChange={() => sessionStore.set({ me: { ...session.me, color: c } })}
              />
              <span className="size-7 rounded-full" style={{ background: `var(--${c})` }} />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2">
          <Eyebrow>Gear</Eyebrow>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {ITEMS.map((it) => {
            const has = owned.includes(it.id);
            return (
              <label
                key={it.id}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 bg-card p-2 text-center",
                  "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                  shown === it.id && "border-primary",
                )}
              >
                <input type="radio" name="gear" className="sr-only" checked={shown === it.id} onChange={() => setPreview(it.id)} />
                <Avatar person={{ ...session.me, accessory: it.id }} size={56} className={cn(!has && "opacity-60")} />
                <span className="text-xs font-bold leading-tight">{it.name}</span>
                {has ? (
                  session.me.accessory === it.id && <Pill tone="mint">On</Pill>
                ) : (
                  <Pill tone={it.rarity === "epic" ? "sun" : it.rarity === "rare" ? "grape" : "muted"}>
                    <Lock className="size-3" aria-hidden /> {it.cost}
                  </Pill>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>
    </Page>
  );
}
