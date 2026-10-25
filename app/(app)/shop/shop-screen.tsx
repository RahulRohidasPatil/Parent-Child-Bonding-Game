"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Sprite } from "@/components/qn/sprite";
import { Card, Coin, Notice, PageHeader, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/qn-data";
import { useQN } from "@/lib/store";

import { economyApi, type ShopItem } from "@/lib/economy-api";
import { refreshWallet } from "@/lib/wallet-api";

/** Cosmetics for coins earned by learning. */
export function ShopScreen() {
  const owned = useQN((s) => s.owned);
  const coins = useQN((s) => s.serverCoins ?? 0);
  const equipped = useQN((s) => s.equipped);
  const [catalog, setCatalog] = useState<ShopItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const look = useQN((s) => s.look);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([economyApi.catalog(), economyApi.inventory(), refreshWallet()]).then(([items]) => setCatalog(items)).catch((e) => setNote(e.message));
  }, []);
  const priceOf = (id: string) => catalog.find((i) => i.id === id)?.price;
  async function wear(id: string, slot = "look") {
    setBusy(id); setNote(null);
    try { await economyApi.equip(slot, equipped[slot] === id && slot !== "look" ? null : id); }
    catch (e) { setNote(e instanceof Error ? e.message : "Couldn’t equip this item."); }
    finally { setBusy(null); }
  }
  async function buy(id: string) {
    setBusy(id); setNote(null);
    try { const item = catalog.find((i) => i.id === id); await economyApi.buy(id); if (item) await economyApi.equip(item.slot, id); }
    catch (e) { setNote(e instanceof Error ? e.message : "Couldn’t buy this item."); }
    finally { setBusy(null); }
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
                      <span className="flex h-11 items-center justify-center gap-1.5 text-sm font-black text-brand-ink">
                        <Check className="size-4" strokeWidth={3} /> Wearing
                      </span>
                    ) : has ? (
                      <Button variant="soft" size="pill" disabled={busy !== null} onClick={() => wear(a.id)}>
                        Wear
                      </Button>
                    ) : (
                      <Button variant="brand" size="pill" disabled={busy !== null || priceOf(a.id) === undefined} onClick={() => buy(a.id)}>
                        <Coin size={18} /> {priceOf(a.id) ?? "…"}
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
        <span className="flex items-center gap-1.5 text-sm font-black text-brand-ink">
          <Check className="size-4" strokeWidth={3} /> Owned
        </span>
      </Card>
      <section className="flex flex-col gap-3"><h2 className="text-lg font-black">Clothes and accessories</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{catalog.filter((i) => i.slot !== "look" && i.slot !== "pet").map((item) => <Card key={item.id} className="flex flex-col gap-2 p-3">
          <span className="font-extrabold">{item.name}</span><span className="text-sm text-muted-foreground">{item.slot}</span>
          <Button variant={equipped[item.slot] === item.id ? "brand" : "soft"} size="pill" disabled={busy !== null} onClick={() => owned.includes(item.id) ? wear(item.id, item.slot) : buy(item.id)}>
            {owned.includes(item.id) ? equipped[item.slot] === item.id ? "Equipped · remove" : "Equip" : <><Coin size={16} /> {item.price}</>}
          </Button>
        </Card>)}</div>
      </section>
      <p className="text-sm font-bold text-muted-foreground">{coins} coins available. Purchases and equipment are saved to your account. Clothing selections are saved; the current character preview shows your selected look.</p>
    </Page>
  );
}
