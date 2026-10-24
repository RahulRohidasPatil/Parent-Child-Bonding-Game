"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, House, Swords } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { Face } from "@/components/qn/sprite";
import { Card, Notice, PageHeader, Segmented } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { homeIdOf } from "@/lib/home-data";
import { AVATARS, FAMILY, FRIENDS } from "@/lib/qn-data";

const DOT = { on: "#3fbf7f", away: "#f5b93a", off: "#b9c6ce" } as const;

export function FriendsScreen() {
  const [tab, setTab] = useState<"family" | "friends">("family");
  const [copied, setCopied] = useState(false);
  const people = tab === "family" ? FAMILY : FRIENDS;
  const code = tab === "family" ? "NEST-4821" : "NOVA-7Q2K";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the code is visible anyway */
    }
  }

  return (
    <Page>
      <PageHeader title="Friends and family" sub="Duel the people you learn with" />
      <Notice tone="info">Preview: friend lists and family links need backend support, so these people are examples.</Notice>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex flex-col gap-3">
          <Segmented label="List" value={tab} onChange={setTab} options={[{ value: "family", label: "Family" }, { value: "friends", label: "Friends" }]} />
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {people.map((p) => (
              <li key={p.name}>
                <Card className="flex items-center gap-3 p-3">
                  <span className="relative">
                    <Face id={p.avatar} size={52} tint={AVATARS.find((a) => a.id === p.avatar)?.tint} />
                    <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-[3px] border-card" style={{ background: DOT[p.online] }} aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-[16px] font-black">{p.name}</span>
                    <span className="truncate text-[13px] font-bold text-muted-foreground">{p.status}</span>
                    <span className="text-xs font-extrabold text-brand-ink">{p.base}</span>
                  </span>
                  {homeIdOf(p.name) && (
                    <Link href={`/base/visit/${homeIdOf(p.name)}`} aria-label={`Visit ${p.name}’s home`} className="flex size-11 items-center justify-center rounded-xl border border-line bg-card hover:bg-muted">
                      <House className="size-[18px]" strokeWidth={2.4} />
                    </Link>
                  )}
                  <Link href="/play/duel" aria-label={`Duel ${p.name}`} className="flex size-11 items-center justify-center rounded-xl bg-night text-white">
                    <Swords className="size-[18px]" strokeWidth={2.4} />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <Card className="flex flex-col gap-2.5 p-4">
          <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">{tab === "family" ? "FAMILY CODE" : "MY FRIEND CODE"}</span>
          <div className="flex gap-2.5">
            <span className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-muted text-xl font-black tracking-[.12em]">{code}</span>
            <Button variant="night" size="pill" onClick={copy} className="h-12">
              <Copy /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <span className="text-[13px] font-bold text-muted-foreground">
            {tab === "family" ? "Grown-ups join with this code to link progress and check notes." : "A parent approves each new friend before you can visit."}
          </span>
        </Card>
      </div>
    </Page>
  );
}
