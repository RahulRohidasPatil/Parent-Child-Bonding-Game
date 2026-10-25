"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Swords, UserMinus, UserPlus, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { tintOf } from "@/components/qn/duel";
import { Face } from "@/components/qn/sprite";
import { Card, EmptyState, Field, Notice, PageHeader, Pill, Spinner } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { type ChallengeSummary, FriendsError, type FriendsSnapshot, type Person, friendsApi } from "@/lib/friends-api";
import { useQN } from "@/lib/store";
import { cn } from "@/lib/utils";

const POLL_MS = 15_000;
const message = (e: unknown, fallback: string) => (e instanceof FriendsError ? e.message : fallback);

function Who({ p, sub, children }: { p: Person; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-3">
      <Face id={p.avatar} size={52} tint={tintOf(p.avatar)} />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[16px] font-black">{p.name}</span>
        {p.username && <span className="truncate text-[13px] font-bold text-muted-foreground">@{p.username}</span>}
        {sub}
      </span>
      {children}
    </Card>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[17px] font-black">
        {title}
        {count ? <span className="text-muted-foreground"> · {count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

const ORDER: Record<ChallengeSummary["status"], number> = { "your-turn": 0, waiting: 1, done: 2, declined: 3 };

function DuelRow({ c }: { c: ChallengeSummary }) {
  const them = c.opponent.name;
  const headline = c.sentByMe ? `You challenged ${them}` : `${them} challenged you`;
  let right: React.ReactNode;
  if (c.status === "your-turn") {
    right = (
      <Link href={`/play/challenge/${c.id}`} className={cn(buttonVariants({ variant: "brand", size: "pill" }))}>
        Play
      </Link>
    );
  } else if (c.status === "waiting") {
    right = <Pill className="bg-muted text-muted-foreground">Waiting</Pill>;
  } else if (c.status === "declined") {
    right = <Pill className="bg-muted text-muted-foreground">{c.sentByMe ? "Declined" : "Called off"}</Pill>;
  } else {
    const won = c.myScore! > c.theirScore!;
    const draw = c.myScore === c.theirScore;
    right = (
      <Link href={`/play/challenge/${c.id}`} className="flex flex-col items-end gap-0.5 rounded-xl px-2 py-1 hover:bg-muted">
        <Pill className={draw ? "bg-warn text-warn-ink" : won ? "bg-brand-soft text-brand-dark" : "bg-rose text-rose-ink"}>{draw ? "Draw" : won ? "You won" : `${them} won`}</Pill>
        <span className="text-[13px] font-extrabold text-muted-foreground">
          {c.myScore} – {c.theirScore}
        </span>
      </Link>
    );
  }
  return (
    <li>
      <Who
        p={c.opponent}
        sub={
          <span className="truncate text-[13px] font-extrabold text-brand-ink">
            {headline} · {c.lessonTitle} · {c.total} questions
          </span>
        }
      >
        {right}
      </Who>
    </li>
  );
}

export function FriendsScreen() {
  const look = useQN((s) => s.look);
  const [snap, setSnap] = useState<FriendsSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setSnap(await friendsApi.snapshot());
      setLoadError(null);
    } catch (e) {
      setLoadError(message(e, "Couldn’t load your friends."));
    }
  }, []);

  // Requests and duels arrive from other phones, so check again every so often while the page is open.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load of server data
    load();
    const tick = () => document.visibilityState === "visible" && load();
    const t = setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", tick);
    };
  }, [load]);

  // Friends see the look picked in the shop.
  useEffect(() => {
    friendsApi.setLook(look).catch(() => undefined);
  }, [look]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return setNote({ tone: "error", text: "Type your friend’s username first." });
    setAdding(true);
    setNote(null);
    try {
      const { outcome, person } = await friendsApi.add(username);
      setNote({ tone: "ok", text: outcome === "accepted" ? `${person.name} had already asked, so you’re friends now.` : `Request sent. ${person.name} needs to accept it.` });
      setUsername("");
      await load();
    } catch (err) {
      setNote({ tone: "error", text: message(err, "Couldn’t send the request.") });
    } finally {
      setAdding(false);
    }
  }

  async function act(id: string, run: () => Promise<unknown>, fallback: string) {
    setBusy(id);
    try {
      await run();
      await load();
    } catch (err) {
      setNote({ tone: "error", text: message(err, fallback) });
    } finally {
      setBusy(null);
      setRemoving(null);
    }
  }

  async function copy() {
    if (!snap?.me.username) return;
    try {
      await navigator.clipboard.writeText(snap.me.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the username is visible anyway */
    }
  }

  const duels = snap ? [...snap.challenges].sort((a, b) => ORDER[a.status] - ORDER[b.status]).slice(0, 12) : [];

  return (
    <Page>
      <PageHeader title="Friends" sub="Add friends by username, then challenge them to a duel" />
      {loadError && !snap && <Notice>{loadError}</Notice>}
      {!snap && !loadError && (
        <Card className="flex items-center justify-center gap-2.5 p-8 text-[15px] font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand" /> Loading your friends…
        </Card>
      )}
      {snap && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <aside className="flex flex-col gap-3 lg:order-2">
            <Card className="flex flex-col gap-3 p-4">
              <form onSubmit={add} className="flex flex-col gap-3">
                <Field
                  label="Add a friend"
                  placeholder="Their username"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={64}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Button type="submit" variant="brand" size="pill" disabled={adding}>
                  {adding ? <Spinner /> : <UserPlus />} Send request
                </Button>
              </form>
              {note && (
                <Notice tone={note.tone} onClose={() => setNote(null)}>
                  {note.text}
                </Notice>
              )}
            </Card>
            <Card className="flex flex-col gap-2.5 p-4">
              <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">MY USERNAME</span>
              {snap.me.username ? (
                <div className="flex gap-2.5">
                  <span className="flex h-12 min-w-0 flex-1 items-center justify-center truncate rounded-2xl bg-muted px-3 text-xl font-black">@{snap.me.username}</span>
                  <Button variant="night" size="pill" onClick={copy} className="h-12">
                    <Copy /> {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              ) : (
                <span className="text-[14px] font-bold text-muted-foreground">Your account has no username yet, so friends can’t find you. Ask whoever set up your account to add one.</span>
              )}
              <span className="text-[13px] font-bold text-muted-foreground">Share it so friends can send you a request.</span>
            </Card>
            {snap.outgoing.length > 0 && (
              <Section title="Sent requests" count={snap.outgoing.length}>
                <ul className="flex flex-col gap-2.5">
                  {snap.outgoing.map((r) => (
                    <li key={r.id}>
                      <Who p={r.to} sub={<span className="text-[13px] font-extrabold text-brand-ink">Waiting for them to accept</span>}>
                        <Button variant="soft" size="pill" disabled={busy === r.id} onClick={() => act(r.id, () => friendsApi.answer(r.id, "cancel"), "Couldn’t cancel the request.")}>
                          Cancel
                        </Button>
                      </Who>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </aside>

          <div className="flex flex-col gap-5 lg:order-1">
            {loadError && <Notice tone="warn">{loadError} Showing what we had.</Notice>}
            {snap.incoming.length > 0 && (
              <Section title="Friend requests" count={snap.incoming.length}>
                <ul className="flex flex-col gap-2.5">
                  {snap.incoming.map((r) => (
                    <li key={r.id}>
                      <Who p={r.from} sub={<span className="text-[13px] font-extrabold text-brand-ink">Wants to be friends</span>}>
                        <Button
                          variant="brand"
                          size="round"
                          aria-label={`Accept ${r.from.name}`}
                          disabled={busy === r.id}
                          onClick={() => act(r.id, () => friendsApi.answer(r.id, "accept"), "Couldn’t accept the request.")}
                        >
                          <Check strokeWidth={3} />
                        </Button>
                        <Button
                          variant="soft"
                          size="round"
                          aria-label={`Decline ${r.from.name}`}
                          disabled={busy === r.id}
                          onClick={() => act(r.id, () => friendsApi.answer(r.id, "decline"), "Couldn’t decline the request.")}
                        >
                          <X strokeWidth={3} />
                        </Button>
                      </Who>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {duels.length > 0 && (
              <Section title="Duels">
                <ul className="flex flex-col gap-2.5">
                  {duels.map((c) => (
                    <DuelRow key={c.id} c={c} />
                  ))}
                </ul>
              </Section>
            )}

            <Section title="Friends" count={snap.friends.length}>
              {snap.friends.length === 0 ? (
                <EmptyState title="No friends yet">Ask a friend for their username and send them a request. Once they accept, you can challenge them to a duel.</EmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {snap.friends.map((f) => (
                    <li key={f.id}>
                      <Who p={f}>
                        {removing === f.id ? (
                          <>
                            <Button variant="destructive" size="pill" disabled={busy === f.id} onClick={() => act(f.id, () => friendsApi.remove(f.id), "Couldn’t remove that friend.")}>
                              Remove
                            </Button>
                            <Button variant="soft" size="pill" onClick={() => setRemoving(null)}>
                              Keep
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="soft" size="round" aria-label={`Remove ${f.name}`} onClick={() => setRemoving(f.id)}>
                              <UserMinus />
                            </Button>
                            <Link
                              href={`/play/challenge/new?friend=${encodeURIComponent(f.id)}`}
                              aria-label={`Challenge ${f.name} to a duel`}
                              className="flex size-11 items-center justify-center rounded-xl bg-night text-white"
                            >
                              <Swords className="size-[18px]" strokeWidth={2.4} />
                            </Link>
                          </>
                        )}
                      </Who>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </Page>
  );
}
