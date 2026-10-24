"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Sprite } from "@/components/qn/sprite";
import { Card, Coin, Notice, PageHeader, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";

const PRICE: Record<string, number> = { nova: 0, mia: 300, zara: 300, leo: 300, sam: 300, mom: 500, dad: 500 };

/** Cosmetics for coins earned by learning. */
export function ShopScreen() {
  const owned = useQN((s) => s.owned);
  const coins = useQN((s) => s.coins);
  const look = useQN((s) => s.look);
  const [note, setNote] = useState<string | null>(null);

  function buy(id: string) {
    const price = PRICE[id] ?? 300;
    if (coins < price) return setNote(`You need ${price - coins} more coins. Quizzes, flashcards and duels earn coins.`);
    setNote(null);
    setState((s) => ({ coins: s.coins - price, owned: [...s.owned, id], look: id as typeof s.look }));
  }

  return (
    <Page wide>
      <PageHeader title="Shop" sub="Spend the coins you earn learning" right={<StatChips />} />
      {note && <Notice tone="warn" onClose={() => setNote(null)}>{note}</Notice>}
      <section className="flex flex-col gap-3" aria-labelledby="looks-h">
        <h2 id="looks-h" className="text-[17px] font-black">Looks</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {AVATARS.map((a) => {
            const has = owned.includes(a.id);
            const wearing = look === a.id;
            return (
              <li key={a.id}>
                <Card className="flex flex-col overflow-hidden">
                  <div className="flex h-[150px] items-end justify-center md:h-[180px]" style={{ background: a.tint }}>
                    <Sprite id={a.id} alt={a.label} className="w-[150px] md:w-[180px]" />
                  </div>
                  <div className="flex flex-col gap-2 p-3">
                    <span className="text-sm leading-snug font-extrabold">{a.label}</span>
                    {wearing ? (
                      <span className="flex h-11 items-center justify-center gap-1.5 text-sm font-black text-brand">
                        <Check className="size-4" strokeWidth={3} /> Wearing
                      </span>
                    ) : has ? (
                      <Button variant="soft" size="pill" onClick={() => setState({ look: a.id })}>
                        Wear
                      </Button>
                    ) : (
                      <Button variant="brand" size="pill" onClick={() => buy(a.id)}>
                        <Coin size={18} /> {PRICE[a.id]}
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
      <Card className="flex items-center gap-4 p-4">
        <Sprite id="cat" className="w-14" alt="Mochi the cat" />
        <span className="flex flex-1 flex-col">
          <span className="text-[16px] font-black">Mochi the cat</span>
          <span className="text-sm font-bold text-muted-foreground">Your study buddy. More pets are on the way.</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm font-black text-brand">
          <Check className="size-4" strokeWidth={3} /> Owned
        </span>
      </Card>
      <p className="text-[13px] font-bold text-muted-foreground">Coins and items are saved in this browser for now.</p>
    </Page>
  );
}
