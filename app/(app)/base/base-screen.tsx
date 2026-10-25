"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Lock, Move, Plus, Sofa, Undo2, Users, Wrench, ZoomIn, ZoomOut } from "lucide-react";
import { Page } from "@/components/qn/app-shell";
import { IsoHouse, IsoRoom, type HouseSlot } from "@/components/qn/iso-house";
import { Sheet } from "@/components/qn/sheet";
import { Face } from "@/components/qn/sprite";
import { Coin, PageHeader, ProgressBar, StatChips } from "@/components/qn/ui";
import { Button } from "@/components/ui/button";
import { SPRITE_SIZE } from "@/lib/furniture-sizes";
import {
  BUILD_COST,
  FRIEND_HOMES,
  MAX_LEVEL,
  PLACE_COST,
  ROOMS,
  ROOM_GRID,
  UNLOCK_LEVEL,
  UPGRADE_COST,
  arrangeRoom,
  fits,
  freeSpot,
  freshLevels,
  homeIdOf,
  homeSummary,
  levelsOf,
  nextLook,
  placementOf,
  roomOf,
  stageFor,
  unlockProgress,
  type HomeItem,
  type RoomId,
  type RoomLayout,
} from "@/lib/home-data";
import { AVATARS, FRIENDS } from "@/lib/qn-data";
import { setState, useQN } from "@/lib/store";
import { useClientValue } from "@/lib/use-client-value";
import { cn } from "@/lib/utils";

type SheetKind = "add" | "item" | "room" | "friends" | "test" | null;

/** Test tools show on localhost, or anywhere after opening /base?test=1 once (?test=0 hides them). */
function readTestTools() {
  try {
    const q = new URLSearchParams(window.location.search).get("test");
    if (q === "1") localStorage.setItem("qn.test", "1");
    if (q === "0") localStorage.removeItem("qn.test");
    return window.location.hostname === "localhost" || localStorage.getItem("qn.test") === "1";
  } catch {
    return false;
  }
}

/**
 * One shared home, shown as a single house you can zoom in and out of. Tap furniture to upgrade
 * it, "Add furniture" to buy what's missing, "Move" to arrange the room. Once every item in the
 * newest room is at Lv 3, the "+" next to it lets you buy the next room. Looks only.
 */
export function BaseScreen() {
  const home = useQN((s) => s.home);
  const coins = useQN((s) => s.coins);
  const unlimited = useQN((s) => s.unlimitedCoins);
  const testTools = useClientValue(readTestTools, false);
  const built = ROOMS.filter((r) => home.rooms[r.id]);
  const newest = built[built.length - 1] ?? ROOMS[0];
  const next = ROOMS[built.length] ?? null;

  // undefined = look at the newest room; null = zoomed out to the whole house
  const [focusId, setFocusId] = useState<RoomId | null | undefined>(undefined);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const zoomedOut = focusId === null;
  const room = roomOf(focusId && home.rooms[focusId] ? focusId : newest.id);
  const levels = levelsOf(room, home.rooms[room.id]);
  const layout = home.layout[room.id];
  const placed = levels.filter((l) => l > 0).length;
  const unplaced = room.items.length - placed;
  const newestLevels = levelsOf(newest, home.rooms[newest.id]);
  const unlock = unlockProgress(newest, newestLevels);
  const canBuy = !!next && unlock.ready;
  const item = selected !== null ? room.items[selected] : null;

  const houseRooms = built.map((r) => ({ room: r, levels: levelsOf(r, home.rooms[r.id]), layout: home.layout[r.id], grid: ROOM_GRID[r.id] }));
  const focusIndex = zoomedOut ? null : built.findIndex((r) => r.id === room.id);
  const slot: HouseSlot | null = next
    ? { grid: ROOM_GRID[next.id], near: ROOM_GRID[newest.id], ready: canBuy, label: next.name, progress: `${unlock.have}/${unlock.need}`, onClick: () => setSheet("room") }
    : null;

  function look(id: RoomId | null | undefined) {
    setFocusId(id);
    setSelected(null);
    setEditing(false);
  }

  function setLevels(fn: (lv: number[]) => number[], cost: number) {
    setState((s) => ({
      coins: s.coins - cost,
      home: { ...s.home, rooms: { ...s.home.rooms, [room.id]: fn(levelsOf(room, s.home.rooms[room.id])) } },
    }));
  }

  function setLayout(fn: (l: RoomLayout) => RoomLayout | undefined) {
    setState((s) => ({ home: { ...s.home, layout: { ...s.home.layout, [room.id]: fn(s.home.layout[room.id] ?? {}) } } }));
  }

  function place(i: number) {
    const it = room.items[i];
    if (coins < PLACE_COST) return setToast(`You need ${PLACE_COST} coins. Earn more with quizzes, flashcards and duels.`);
    // Put it on a free spot near its usual place, then let the kid drag it where they want.
    const after = levels.map((v, j) => (j === i ? 1 : v));
    const spot = arrangeRoom(room, after, layout).places[i] ?? { at: it.at, rot: 0 };
    setLevels(() => after, PLACE_COST);
    setLayout((l) => ({ ...l, [it.id]: spot }));
    setSheet(null);
    setSelected(i);
    setEditing(true);
    setToast(`Drag the ${it.name.toLowerCase()} where you want it, then tap Done.`);
  }

  function levelUp(i: number) {
    const it = room.items[i];
    const lv = levels[i];
    if (lv >= MAX_LEVEL) return;
    const cost = UPGRADE_COST(lv + 1);
    if (coins < cost) return setToast(`You need ${cost} coins. Earn more with quizzes, flashcards and duels.`);
    setLevels((l) => l.map((v, j) => (j === i ? v + 1 : v)), cost);
    if (it.stages.some((s) => s.from === lv + 1)) setToast(`New look! Your ${it.name.toLowerCase()} reached Lv ${lv + 1}.`);
  }

  function move(i: number, at: [number, number]) {
    const it = room.items[i];
    setLayout((l) => ({ ...l, [it.id]: { ...placementOf(it, l), at } }));
  }

  function rotate(i: number) {
    const it = room.items[i];
    const { places, blockers } = arrangeRoom(room, levels, layout);
    const now = places[i] ?? placementOf(it, layout);
    const rot = (now.rot + 1) % 4;
    // Turn in place if it fits, otherwise slide to the nearest spot where it does.
    const at = freeSpot(it, levels[i], rot, now.at, blockers, i);
    if (!fits(it, levels[i], rot, at, blockers, i)) return setToast(`There’s no room to turn the ${it.name.toLowerCase()} here. Move it somewhere roomier first.`);
    setLayout((l) => ({ ...l, [it.id]: { at, rot } }));
  }

  function buyRoom() {
    if (!next) return;
    const cost = BUILD_COST(built.length);
    if (coins < cost) return setToast(`The ${next.name.toLowerCase()} costs ${cost} coins.`);
    setState((s) => ({ coins: s.coins - cost, home: { ...s.home, rooms: { ...s.home.rooms, [next.id]: freshLevels(next) } } }));
    setSheet(null);
    look(next.id);
    setToast(`Welcome to your new ${next.name.toLowerCase()}! Add furniture to make it yours.`);
  }

  return (
    <Page wide>
      <PageHeader
        title="My base"
        sub="One home you build up, room by room"
        right={
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            {testTools && (
              <Button variant="soft" size="pill" onClick={() => setSheet("test")} aria-label="Test tools" className="h-10 px-3">
                <Wrench /> <span className="hidden sm:inline">Test</span>
              </Button>
            )}
            <Button variant="soft" size="pill" onClick={() => setSheet("friends")} aria-label="Visit friends’ homes" className="h-10 px-3">
              <Users /> <span className="hidden sm:inline">Friends</span>
            </Button>
            <StatChips />
          </div>
        }
      />

      <div className="relative isolate h-[min(70dvh,620px)] min-h-[440px] overflow-hidden rounded-[28px] bg-stage lg:h-[min(76dvh,760px)]">
        <IsoHouse
          rooms={houseRooms}
          focus={focusIndex}
          onFocus={(r) => look(built[r].id)}
          slot={slot}
          selected={selected}
          onSelect={(i) => {
            setSelected(i);
            if (!editing) setSheet("item");
          }}
          editing={editing}
          onMove={move}
          onRotate={rotate}
          className="absolute inset-0 h-full"
          priority
        />

        {/* top bar */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start gap-2">
          <div className="pointer-events-auto mr-auto flex min-w-0 flex-col gap-1.5">
            <span className="w-fit rounded-full bg-card/95 px-3.5 py-1.5 text-sm font-black whitespace-nowrap">
              {zoomedOut ? `Your home · ${built.length} ${built.length === 1 ? "room" : "rooms"}` : `${room.name} · ${placed}/${room.items.length}`}
            </span>
            {next && !editing && (
              <button
                type="button"
                onClick={() => setSheet("room")}
                className="flex w-fit items-center gap-2 rounded-full bg-card/80 py-1 pr-2.5 pl-1.5 text-[12px] font-extrabold whitespace-nowrap hover:bg-card"
              >
                <span className={cn("flex size-5 items-center justify-center rounded-full", canBuy ? "bg-brand text-white" : "bg-track text-muted-foreground")}>
                  {canBuy ? <Plus className="size-3.5" strokeWidth={3} /> : <Lock className="size-3" strokeWidth={3} />}
                </span>
                {canBuy ? `${next.name} ready to buy` : `${next.name}: ${unlock.have}/${unlock.need} at Lv ${UNLOCK_LEVEL}`}
              </button>
            )}
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            {!editing && (
              <>
                {!zoomedOut && placed > 0 && (
                  <Button variant="soft" size="chip" onClick={() => setEditing(true)}>
                    <Move /> Move
                  </Button>
                )}
                <Button
                  variant="soft"
                  size="icon-lg"
                  className="size-9 rounded-full"
                  onClick={() => look(zoomedOut ? room.id : null)}
                  aria-label={zoomedOut ? `Zoom in to the ${room.name.toLowerCase()}` : "Zoom out to see your whole home"}
                  title={zoomedOut ? "Zoom in" : "Zoom out"}
                >
                  {zoomedOut ? <ZoomIn /> : <ZoomOut />}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* bottom bar */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col items-center gap-2">
          {toast && (
            <span role="status" className="pointer-events-auto max-w-full rounded-2xl bg-night px-4 py-2 text-center text-[13px] font-extrabold text-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
              {toast}
            </span>
          )}
          {zoomedOut ? (
            <span className="rounded-full bg-card/90 px-3.5 py-1.5 text-[13px] font-extrabold">Tap a room to look inside</span>
          ) : editing ? (
            <>
              {!toast && <span className="rounded-full bg-card/90 px-3.5 py-1.5 text-center text-[13px] font-extrabold">Drag furniture to move it · tap ⟳ on it to rotate</span>}
              <span className="pointer-events-auto flex gap-2">
                <Button
                  variant="soft"
                  size="pill"
                  className="h-12"
                  onClick={() => {
                    setLayout(() => undefined);
                    setToast(`The ${room.name.toLowerCase()} is back to its starting layout.`);
                  }}
                  disabled={!layout}
                >
                  <Undo2 /> Reset
                </Button>
                <Button variant="night" size="pill" className="h-12 px-6 text-[16px]" onClick={() => setEditing(false)}>
                  <Check /> Done
                </Button>
              </span>
            </>
          ) : (
            unplaced > 0 && (
              <Button variant="brand" size="pill" className="pointer-events-auto h-12 px-5 text-[16px]" onClick={() => setSheet("add")}>
                <Sofa /> Add furniture
                <span className="ml-0.5 rounded-full bg-white/25 px-2 text-[13px]">{unplaced}</span>
              </Button>
            )
          )}
        </div>
      </div>
      <p className="-mt-2 text-center text-[13px] font-bold text-muted-foreground">Looks only: upgrades never change quiz scores.</p>

      {/* add furniture */}
      <Sheet open={sheet === "add"} onClose={() => setSheet(null)} title="Add furniture" sub={`${room.name} · ${placed} of ${room.items.length} placed`}>
        {unplaced === 0 ? (
          <p className="py-6 text-center text-[15px] font-bold text-muted-foreground">Everything’s in! Tap any piece of furniture to upgrade it.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5">
            {room.items.map((it, i) =>
              levels[i] > 0 ? null : (
                <li key={it.id} className="flex flex-col items-center gap-2 rounded-2xl border border-line p-3">
                  <Thumb item={it} level={1} className="h-20 w-full" />
                  <span className="text-[15px] font-black">{it.name}</span>
                  <Button variant="brand" size="pill" className="h-10 w-full" onClick={() => place(i)} aria-label={`Add ${it.name} for ${PLACE_COST} coins`}>
                    <Coin size={18} /> {PLACE_COST}
                  </Button>
                </li>
              ),
            )}
          </ul>
        )}
        <span className="text-center text-[13px] font-bold text-muted-foreground">You have {coins.toLocaleString("en-US")} coins</span>
      </Sheet>

      {/* upgrade an item */}
      <Sheet
        open={sheet === "item" && !!item && levels[selected!] > 0}
        onClose={() => setSheet(null)}
        title={item?.name ?? ""}
        sub={`${room.name} · Lv ${selected !== null ? levels[selected] : 0}`}
      >
        {item && selected !== null && levels[selected] > 0 && (
          <UpgradePanel
            item={item}
            level={levels[selected]}
            coins={coins}
            nextRoom={next && room.id === newest.id ? next.name : null}
            onLevelUp={() => levelUp(selected)}
            onMove={() => {
              setSheet(null);
              setEditing(true);
            }}
          />
        )}
      </Sheet>

      {/* next room */}
      <Sheet
        open={sheet === "room" && !!next}
        onClose={() => setSheet(null)}
        title={next ? (canBuy ? `Buy the ${next.name.toLowerCase()}` : `${next.name} is locked`) : ""}
        sub={next?.blurb}
      >
        {next && (
          <>
            <span className="rounded-3xl bg-stage p-2">
              <IsoRoom room={next} levels={freshLevels(next)} className={cn(!canBuy && "opacity-60 grayscale-[.4]")} />
            </span>
            {canBuy ? (
              <>
                <span className="text-sm font-bold text-muted-foreground">
                  It comes with a {next.items.filter((i) => i.starter).map((i) => i.name.toLowerCase()).join(" and a ")}. Then add up to {next.items.length} pieces of
                  furniture.
                </span>
                <Button variant="brand" size="cta" onClick={buyRoom}>
                  <Coin /> Buy {next.name.toLowerCase()} · {BUILD_COST(built.length).toLocaleString("en-US")}
                </Button>
              </>
            ) : (
              <>
                <span className="flex flex-col gap-1.5">
                  <span className="flex justify-between text-sm font-extrabold">
                    <span>
                      Every {newest.name.toLowerCase()} item at Lv {UNLOCK_LEVEL}
                    </span>
                    <span>
                      {unlock.have}/{unlock.need}
                    </span>
                  </span>
                  <ProgressBar value={(unlock.have / unlock.need) * 100} />
                </span>
                <ul className="flex flex-wrap gap-1.5">
                  {newest.items.map((it, i) => {
                    const lv = newestLevels[i];
                    const ok = lv >= UNLOCK_LEVEL;
                    return (
                      <li
                        key={it.id}
                        className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold", ok ? "bg-brand-soft text-brand-dark" : "bg-muted text-muted-foreground")}
                      >
                        {ok && <Check className="size-3.5" strokeWidth={3} />}
                        {it.name} · {lv > 0 ? `Lv ${lv}` : "not added"}
                      </li>
                    );
                  })}
                </ul>
                <Button
                  variant="soft"
                  size="pill"
                  onClick={() => {
                    setSheet(null);
                    look(newest.id);
                  }}
                >
                  Back to the {newest.name.toLowerCase()} <ArrowRight />
                </Button>
              </>
            )}
            <span className="text-center text-[13px] font-bold text-muted-foreground">You have {coins.toLocaleString("en-US")} coins</span>
          </>
        )}
      </Sheet>

      {/* test tools */}
      <Sheet open={sheet === "test"} onClose={() => setSheet(null)} title="Test tools" sub="For trying out the base. Saved in this browser only.">
        <button
          type="button"
          role="switch"
          aria-checked={unlimited}
          onClick={() => setState((s) => ({ unlimitedCoins: !s.unlimitedCoins, coins: s.unlimitedCoins ? s.coins : 999_999 }))}
          className="flex items-center gap-3 rounded-2xl border border-line p-3 text-left"
        >
          <Coin size={28} />
          <span className="flex flex-1 flex-col leading-tight">
            <span className="text-[15px] font-black">Unlimited coins</span>
            <span className="text-[13px] font-bold text-muted-foreground">{unlimited ? "On: coins stay topped up" : "Off: coins work as normal"}</span>
          </span>
          <span className={cn("relative h-7 w-12 rounded-full transition-colors", unlimited ? "bg-brand" : "bg-input")}>
            <span className={cn("absolute top-1 size-5 rounded-full bg-white transition-all", unlimited ? "left-6" : "left-1")} />
          </span>
        </button>
        <span className="text-[13px] font-black tracking-[.03em] text-muted-foreground">{room.name.toUpperCase()}</span>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" size="pill" onClick={() => setLevels((l) => l.map((v) => Math.max(v, UNLOCK_LEVEL)), 0)}>
            All items Lv {UNLOCK_LEVEL}
          </Button>
          <Button variant="soft" size="pill" onClick={() => setLevels((l) => l.map(() => MAX_LEVEL), 0)}>
            Max out (Lv {MAX_LEVEL})
          </Button>
        </div>
        <span className="text-[13px] font-black tracking-[.03em] text-muted-foreground">WHOLE HOME</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="soft"
            size="pill"
            onClick={() => setState((s) => ({ home: { ...s.home, rooms: Object.fromEntries(ROOMS.map((r) => [r.id, levelsOf(r, s.home.rooms[r.id])])) } }))}
          >
            Build every room
          </Button>
          <Button
            variant="soft"
            size="pill"
            onClick={() => {
              setState({ home: { rooms: { living: freshLevels(ROOMS[0]) }, layout: {} } });
              look(undefined);
              setSheet(null);
              setToast("Back to day one: an old TV and a basic sofa.");
            }}
          >
            Reset to day one
          </Button>
        </div>
      </Sheet>

      {/* friends */}
      <Sheet open={sheet === "friends"} onClose={() => setSheet(null)} title="Visit friends’ homes" sub="See how their homes are coming along">
        <ul className="flex flex-col gap-1">
          {FRIENDS.filter((f) => homeIdOf(f.name)).map((f) => {
            const id = homeIdOf(f.name)!;
            const { built: theirs } = homeSummary(FRIEND_HOMES[id]);
            return (
              <li key={f.name}>
                <Link href={`/base/visit/${id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-muted">
                  <Face id={f.avatar} size={44} tint={AVATARS.find((a) => a.id === f.avatar)?.tint} />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-[16px] font-black">{f.name}</span>
                    <span className="truncate text-[13px] font-bold text-muted-foreground">
                      {theirs.length} {theirs.length === 1 ? "room" : "rooms"} · {theirs.map((r) => r.name.toLowerCase()).join(", ")}
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </Page>
  );
}

/** An item's look at a level, fitted into a box. */
function Thumb({ item, level, className, dim }: { item: HomeItem; level: number; className?: string; dim?: boolean }) {
  const parts = stageFor(item, Math.max(level, 1)).parts;
  const s = (parts[item.thumb ?? 0] ?? parts[0]).s;
  const [w, h] = SPRITE_SIZE[s];
  return (
    <span className={cn("flex items-center justify-center", className)}>
      <Image src={`/qn/furniture/${s}.png`} alt="" width={w} height={h} unoptimized className={cn("max-h-full w-auto max-w-full object-contain", dim && "opacity-55")} />
    </span>
  );
}

/** Now → next, the ten-level ladder and the level-up button (from the "Upgrade an item" design). */
function UpgradePanel({
  item,
  level,
  coins,
  nextRoom,
  onLevelUp,
  onMove,
}: {
  item: HomeItem;
  level: number;
  coins: number;
  nextRoom: string | null;
  onLevelUp: () => void;
  onMove: () => void;
}) {
  const max = level >= MAX_LEVEL;
  const next = Math.min(level + 1, MAX_LEVEL);
  const cost = UPGRADE_COST(next);
  const looks = item.stages.map((s) => s.from);
  const newLook = nextLook(item, level);

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)] items-center">
        <div className="flex flex-col items-center gap-1.5">
          <Thumb item={item} level={level} className="h-28 w-full rounded-[18px] bg-stage p-3" />
          <span className="text-[13px] font-black text-muted-foreground">Now · Lv {level}</span>
        </div>
        <ArrowRight className="size-[22px] justify-self-center text-brand-ink" strokeWidth={3} />
        <div className="flex flex-col items-center gap-1.5">
          <Thumb item={item} level={next} className="h-28 w-full rounded-[18px] border-2 border-brand bg-brand-soft p-3" />
          <span className="text-[13px] font-black text-brand-ink">{max ? "Maxed" : `Next · Lv ${next}${looks.includes(next) ? " · new look" : ""}`}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-black tracking-[.03em] text-muted-foreground">ALL {MAX_LEVEL} LEVELS</span>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: MAX_LEVEL }, (_, k) => {
            const n = k + 1;
            const own = n <= level;
            const isNext = n === level + 1;
            return (
              <span
                key={n}
                className={cn(
                  "relative flex h-[66px] flex-col items-center justify-end overflow-hidden rounded-xl pb-1",
                  own ? "bg-brand-soft" : "bg-muted",
                  isNext ? "border-2 border-brand" : n === level ? "border-2 border-night" : "border border-line",
                )}
              >
                <Thumb item={item} level={n} dim={!own && !isNext} className="h-10 w-[54px]" />
                <span className={cn("text-[11px] font-black", own ? "text-brand-dark" : "text-muted-foreground")}>{own || n === 1 ? `Lv ${n}` : UPGRADE_COST(n)}</span>
                {looks.includes(n) && <span className="absolute top-1 left-1 size-2 rounded-full bg-[#f5b93a]" aria-hidden="true" />}
              </span>
            );
          })}
        </div>
        <span className="text-[12px] font-bold text-muted-foreground">
          Yellow dot = new look{newLook ? ` (next at Lv ${newLook})` : ""}. Each level costs 20 coins more than the last.
        </span>
      </div>

      {nextRoom && (
        <span className={cn("flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-bold", level >= UNLOCK_LEVEL ? "bg-brand-soft text-brand-dark" : "bg-muted")}>
          {level >= UNLOCK_LEVEL ? <Check className="size-4 shrink-0" strokeWidth={3} /> : <Lock className="size-4 shrink-0 text-muted-foreground" />}
          {level >= UNLOCK_LEVEL ? `Counts toward the ${nextRoom.toLowerCase()}` : `Reach Lv ${UNLOCK_LEVEL} to count toward the ${nextRoom.toLowerCase()}`}
        </span>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2.5">
        <Button variant="soft" size="cta" onClick={onMove} className="px-3 text-[16px]">
          <Move /> Move
        </Button>
        <Button variant="brand" size="cta" onClick={onLevelUp} disabled={max}>
          <Coin /> {max ? "Maxed out" : `Level up · ${cost}`}
        </Button>
      </div>
      <span className="text-center text-[13px] font-bold text-muted-foreground">You have {coins.toLocaleString("en-US")} coins</span>
    </>
  );
}
