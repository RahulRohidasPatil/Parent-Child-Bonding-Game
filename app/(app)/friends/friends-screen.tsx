"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Search, Swords, UserMinus, UserPlus, X } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { tintOf } from "@/components/qn/duel";
import { Face } from "@/components/qn/sprite";
import { Card, EmptyState, Field, Notice, PageHeader, Pill, Segmented, Spinner } from "@/components/qn/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { type Duel, type Friends, type PublicUser, type Relationship, SocialError, socialApi } from "@/lib/social-api";
import { useUser } from "@/lib/use-user";
import { cn } from "@/lib/utils";

const POLL_MS = 10_000;
const message = (e: unknown, fallback: string) => (e instanceof SocialError ? e.message : fallback);

function statusOf(p: PublicUser) {
  if (p.busy) return { dot: "#f5b93a", text: "In a duel" };
  if (p.online) return { dot: "#3fbf7f", text: "Online" };
  return { dot: "#b9c6ce", text: "Offline" };
}

function Who({ p, sub, showStatus, children }: { p: PublicUser; sub?: React.ReactNode; showStatus?: boolean; children?: React.ReactNode }) {
  const status = showStatus ? statusOf(p) : null;
  return (
    <Card className="flex items-center gap-3 p-3">
      <span className="relative">
        <Face id={p.avatar} size={52} tint={tintOf(p.avatar)} />
        {status && <span className="absolute right-0 bottom-0 size-3.5 rounded-full border-[3px] border-card" style={{ background: status.dot }} aria-hidden="true" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[16px] font-black">{p.display_name}</span>
        <span className="truncate text-[13px] font-bold text-muted-foreground">
          @{p.username}
          {status && ` · ${status.text}`}
        </span>
        {sub}
      </span>
      {children}
    </Card>
  );
}

function Section({ title, count, right, children }: { title: string; count?: number; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-black">
          {title}
          {count ? <span className="text-muted-foreground"> · {count}</span> : null}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function FriendsScreen() {
  const { user } = useUser();
  const [data, setData] = useState<Friends | null>(null);
  const [current, setCurrent] = useState<Duel | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onlineOnly, setOnlineOnly] = useState<"all" | "online">("all");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<(PublicUser & { relationship: Relationship })[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [friends, duel] = await Promise.all([socialApi.friends(onlineOnly === "online"), socialApi.currentDuel().catch(() => null)]);
      setData(friends);
      setCurrent(duel);
      setLoadError(null);
    } catch (e) {
      setLoadError(message(e, "Couldn’t load your friends."));
    }
  }, [onlineOnly]);

  // Friends come online and go offline, so check again every few seconds while the page is open.
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

  // Search as you type (from 2 letters), a moment after the last key.
  const term = q.trim().replace(/^@/, "");
  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { users } = await socialApi.search(term);
        if (live) setResults(users);
      } catch (e) {
        if (live) setNote({ tone: "error", text: message(e, "Couldn’t search right now.") });
      } finally {
        if (live) setSearching(false);
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [term]);
  const shown = term.length >= 2 ? results : null;

  async function act(key: string, run: () => Promise<unknown>, fallback: string, done?: string) {
    setBusy(key);
    setNote(null);
    try {
      await run();
      if (done) setNote({ tone: "ok", text: done });
      await load();
      if (term.length >= 2) setResults((await socialApi.search(term)).users);
    } catch (err) {
      setNote({ tone: "error", text: message(err, fallback) });
    } finally {
      setBusy(null);
      setRemoving(null);
    }
  }

  async function copy() {
    if (!user?.username) return;
    try {
      await navigator.clipboard.writeText(user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can be blocked; the username is visible anyway */
    }
  }

  const incomingFrom = (id: string) => data?.incoming.find((r) => r.from.id === id);

  function searchAction(u: PublicUser & { relationship: Relationship }) {
    if (u.relationship === "friend") return <Pill className="bg-brand-soft text-brand-dark">Friends</Pill>;
    if (u.relationship === "request_sent") return <Pill className="bg-muted text-muted-foreground">Requested</Pill>;
    const req = u.relationship === "request_received" ? incomingFrom(u.id) : undefined;
    return (
      <Button
        variant="brand"
        size="pill"
        disabled={busy === u.id}
        onClick={() =>
          req
            ? act(u.id, () => socialApi.accept(req.id), "Couldn’t accept the request.", `You and ${u.display_name} are friends now.`)
            : act(
                u.id,
                async () => {
                  const r = await socialApi.request(u.username);
                  if (r.status === "accepted") setNote({ tone: "ok", text: `${u.display_name} had already asked, so you’re friends now.` });
                },
                "Couldn’t send the request.",
                `Request sent. ${u.display_name} needs to accept it.`,
              )
        }
      >
        {req ? <Check /> : <UserPlus />} {req ? "Accept" : "Add"}
      </Button>
    );
  }

  const duelWith = current ? (current.my_role === "challenger" ? current.opponent : current.challenger) : null;

  return (
    <Page>
      <PageHeader title="Friends" sub="Find friends by username, then challenge whoever is online" />
      {loadError && !data && <Notice>{loadError}</Notice>}
      {!data && !loadError && (
        <Card className="flex items-center justify-center gap-2.5 p-8 text-[15px] font-extrabold text-muted-foreground" role="status">
          <Spinner className="text-brand" /> Loading your friends…
        </Card>
      )}
      {current && duelWith && (
        <Notice tone="info">
          {current.status === "invited" && current.my_role === "challenger" ? `Waiting for ${duelWith.display_name} to accept your duel.` : `You’re in a duel with ${duelWith.display_name}.`}{" "}
          <Link href={`/play/challenge/${current.id}`} className="font-black underline">
            Open it
          </Link>
        </Notice>
      )}
      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <aside className="flex flex-col gap-3 lg:order-2">
            <Card className="flex flex-col gap-3 p-4">
              <Field
                label="Find a friend"
                placeholder="Type their username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={64}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                labelExtra={searching ? <Spinner className="size-4 text-brand" /> : <Search className="size-4 text-muted-foreground" />}
              />
              {note && (
                <Notice tone={note.tone} onClose={() => setNote(null)}>
                  {note.text}
                </Notice>
              )}
              {shown && shown.length === 0 && !searching && <span className="text-[14px] font-bold text-muted-foreground">No one with a username starting “{term}”. They need to have logged in once.</span>}
              {shown && shown.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {shown.map((u) => (
                    <li key={u.id}>
                      <Who p={u} showStatus={u.relationship === "friend"}>
                        {searchAction(u)}
                      </Who>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="flex flex-col gap-2.5 p-4">
              <span className="text-[13px] font-black tracking-[.04em] text-muted-foreground">MY USERNAME</span>
              {user?.username ? (
                <div className="flex gap-2.5">
                  <span className="flex h-12 min-w-0 flex-1 items-center justify-center truncate rounded-2xl bg-muted px-3 text-xl font-black">@{user.username}</span>
                  <Button variant="night" size="pill" onClick={copy} className="h-12">
                    <Copy /> {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              ) : (
                <span className="text-[14px] font-bold text-muted-foreground">Your account has no username yet, so friends can’t find you. Ask whoever set up your account to add one.</span>
              )}
              <span className="text-[13px] font-bold text-muted-foreground">Share it so friends can find you.</span>
            </Card>
            {data.outgoing.length > 0 && (
              <Section title="Sent requests" count={data.outgoing.length}>
                <ul className="flex flex-col gap-2.5">
                  {data.outgoing.map((r) => (
                    <li key={r.id}>
                      <Who p={r.to} sub={<span className="text-[13px] font-extrabold text-brand-ink">Waiting for them to accept</span>}>
                        <Button variant="soft" size="pill" disabled={busy === r.id} onClick={() => act(r.id, () => socialApi.cancelRequest(r.id), "Couldn’t cancel the request.")}>
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
            {data.incoming.length > 0 && (
              <Section title="Friend requests" count={data.incoming.length}>
                <ul className="flex flex-col gap-2.5">
                  {data.incoming.map((r) => (
                    <li key={r.id}>
                      <Who p={r.from} sub={<span className="text-[13px] font-extrabold text-brand-ink">Wants to be friends</span>}>
                        <Button variant="brand" size="round" aria-label={`Accept ${r.from.display_name}`} disabled={busy === r.id} onClick={() => act(r.id, () => socialApi.accept(r.id), "Couldn’t accept the request.")}>
                          <Check strokeWidth={3} />
                        </Button>
                        <Button variant="soft" size="round" aria-label={`Decline ${r.from.display_name}`} disabled={busy === r.id} onClick={() => act(r.id, () => socialApi.decline(r.id), "Couldn’t decline the request.")}>
                          <X strokeWidth={3} />
                        </Button>
                      </Who>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section
              title="Friends"
              count={data.friends.length}
              right={<Segmented label="Show" value={onlineOnly} onChange={setOnlineOnly} options={[{ value: "all", label: "All" }, { value: "online", label: "Online now" }]} className="w-[200px]" />}
            >
              {data.friends.length === 0 ? (
                <EmptyState title={onlineOnly === "online" ? "No friends online" : "No friends yet"}>
                  {onlineOnly === "online" ? "When a friend opens the app, they show up here and you can challenge them." : "Search for a friend’s username and send them a request. Once they accept, you can challenge them when they’re online."}
                </EmptyState>
              ) : (
                <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {data.friends.map((f) => {
                    const canDuel = !!f.online && !f.busy && !current;
                    return (
                      <li key={f.id}>
                        <Who p={f} showStatus>
                          {removing === f.id ? (
                            <>
                              <Button variant="destructive" size="pill" disabled={busy === f.id} onClick={() => act(f.id, () => socialApi.unfriend(f.id), "Couldn’t remove that friend.")}>
                                Remove
                              </Button>
                              <Button variant="soft" size="pill" onClick={() => setRemoving(null)}>
                                Keep
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="soft" size="round" aria-label={`Remove ${f.display_name}`} onClick={() => setRemoving(f.id)}>
                                <UserMinus />
                              </Button>
                              {canDuel ? (
                                <Link
                                  href={`/play/challenge/new?friend=${encodeURIComponent(f.id)}`}
                                  aria-label={`Challenge ${f.display_name} to a duel`}
                                  className={cn(buttonVariants({ variant: "night", size: "round" }), "rounded-xl")}
                                >
                                  <Swords />
                                </Link>
                              ) : (
                                <span
                                  role="img"
                                  aria-label={`Can’t challenge ${f.display_name}: ${current ? "you’re in a duel" : f.busy ? "in a duel" : "offline"}`}
                                  title={current ? "Finish your duel first" : f.busy ? "In a duel" : "Offline"}
                                  className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                                >
                                  <Swords className="size-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Who>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </Page>
  );
}
