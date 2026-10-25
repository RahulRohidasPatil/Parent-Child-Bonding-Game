"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Lock, Plus, RotateCw } from "lucide-react";
import {
  FLOOR_TILES,
  TILE_HH,
  TILE_HW,
  arrangeRoom,
  clampItem,
  fits,
  partLift,
  rotateOffset,
  rotateSprite,
  spriteBox,
  stageFor,
  type Blocker,
  type HomeItem,
  type RoomDef,
  type RoomLayout,
} from "@/lib/home-data";
import { cn } from "@/lib/utils";

/**
 * The home as one isometric scene: every built room sits on a grid (ROOM_GRID), walls on the
 * outside of the house are full height and walls between rooms are low, so you can see in.
 * `focus` zooms the camera onto one room (null shows the whole house). Only the focused room's
 * furniture is interactive: tap to select, and with `editing`, drag (or arrow keys, R to rotate).
 * Furniture always stays on its room's floor, whatever its level, rotation or saved position.
 */
const SIZE = FLOOR_TILES;
const S = 1.25; // sprite scale
const HW = TILE_HW * S; // half a tile's width on screen
const HH = TILE_HH * S; // half a tile's height on screen
const WALL = 150;
const LOW = 16; // walls between rooms
const T = 12; // floor thickness

const iso = (x: number, y: number): [number, number] => [(x - y) * HW, (x + y) * HH];

export type HouseRoom = { room: RoomDef; levels: number[]; layout?: RoomLayout; grid: [number, number] };
export type HouseSlot = { grid: [number, number]; near: [number, number]; ready: boolean; label: string; progress: string; onClick?: () => void };

type Box = { x0: number; y0: number; x1: number; y1: number };

function roomBox([gx, gy]: [number, number]): Box {
  const ox = gx * SIZE;
  const oy = gy * SIZE;
  return { x0: iso(ox, oy + SIZE)[0] - 14, x1: iso(ox + SIZE, oy)[0] + 14, y0: iso(ox, oy)[1] - WALL - 16, y1: iso(ox + SIZE, oy + SIZE)[1] + T + 12 };
}
const union = (boxes: Box[]): Box => ({
  x0: Math.min(...boxes.map((b) => b.x0)),
  y0: Math.min(...boxes.map((b) => b.y0)),
  x1: Math.max(...boxes.map((b) => b.x1)),
  y1: Math.max(...boxes.map((b) => b.y1)),
});
const r0 = roomBox([0, 0]);
/** Width ÷ height of a single room seen on its own. */
export const ROOM_ASPECT = (r0.x1 - r0.x0) / (r0.y1 - r0.y0);

/** Fit a box into a camera of the given aspect, centred, with a little breathing room. */
function fit(b: Box, aspect: number, pad: number) {
  const bw = (b.x1 - b.x0) * (1 + pad);
  const bh = (b.y1 - b.y0) * (1 + pad);
  const w = bw / bh > aspect ? bw : bh * aspect;
  const h = w / aspect;
  return { x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - h / 2, w, h };
}

/** Arrow keys move along the screen, in tiles. */
const NUDGE: Record<string, [number, number]> = {
  ArrowUp: [-0.1, -0.1],
  ArrowDown: [0.1, 0.1],
  ArrowLeft: [-0.1, 0.1],
  ArrowRight: [0.1, -0.1],
};

export function IsoHouse({
  rooms,
  focus,
  onFocus,
  slot,
  selected,
  onSelect,
  editing = false,
  onMove,
  onRotate,
  aspect,
  className,
  priority,
}: {
  rooms: HouseRoom[];
  focus: number | null;
  onFocus?: (index: number) => void;
  slot?: HouseSlot | null;
  selected?: number | null;
  onSelect?: (index: number) => void;
  editing?: boolean;
  onMove?: (index: number, at: [number, number]) => void;
  onRotate?: (index: number) => void;
  /** Fixed width ÷ height; leave out to fill the parent and measure it. */
  aspect?: number;
  className?: string;
  priority?: boolean;
}) {
  const view = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: [number, number]; from: [number, number] } | null>(null);
  const [live, setLive] = useState<{ i: number; at: [number, number] } | null>(null);
  const [measured, setMeasured] = useState<number | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (aspect || !view.current) return;
    const el = view.current;
    const ro = new ResizeObserver(() => {
      if (el.clientHeight > 0) setMeasured(el.clientWidth / el.clientHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const ratio = aspect ?? measured ?? 1.2;
  const wb = union([...rooms.map((r) => roomBox(r.grid)), ...(slot ? [roomBox(slot.grid)] : [])]);
  const WW = wb.x1 - wb.x0;
  const WH = wb.y1 - wb.y0;
  const focused = focus !== null ? rooms[focus] : null;
  const cam = focused ? fit(roomBox(focused.grid), ratio, aspect ? 0 : 0.04) : fit(wb, ratio, rooms.length > 1 || slot ? 0.06 : 0);
  const px = (x: number) => `${((x - wb.x0) / WW) * 100}%`;
  const py = (y: number) => `${((y - wb.y0) / WH) * 100}%`;

  /** Pointer position → floor point in the house (tiles). */
  function toFloor(e: React.PointerEvent): [number, number] {
    const r = world.current!.getBoundingClientRect();
    const sx = wb.x0 + ((e.clientX - r.left) / r.width) * WW;
    const sy = wb.y0 + ((e.clientY - r.top) / r.height) * WH;
    return [(sx / HW + sy / HH) / 2, (sy / HH - sx / HW) / 2];
  }

  function editHandlers(i: number, item: HomeItem, lv: number, rot: number, from: [number, number], blockers: Blocker[]) {
    if (!editing) return { onClick: () => onSelect?.(i) };
    const ok = (at: [number, number]) => fits(item, lv, rot, at, blockers, i);
    /** Follow the pointer, sliding along other furniture instead of going through it. */
    const step = (want: [number, number], last: [number, number]): [number, number] => {
      const c = clampItem(item, lv, rot, want);
      for (const t of [c, clampItem(item, lv, rot, [c[0], last[1]]), clampItem(item, lv, rot, [last[0], c[1]])]) if (ok(t)) return t;
      return last;
    };
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { start: toFloor(e), from };
        onSelect?.(i);
      },
      onPointerMove: (e: React.PointerEvent) => {
        const d = drag.current;
        if (!d) return;
        const [x, y] = toFloor(e);
        setLive({ i, at: step([d.from[0] + x - d.start[0], d.from[1] + y - d.start[1]], live?.i === i ? live.at : d.from) });
      },
      onPointerUp: () => {
        if (drag.current && live) onMove?.(live.i, live.at);
        drag.current = null;
        setLive(null);
      },
      onPointerCancel: () => {
        drag.current = null;
        setLive(null);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        const n = NUDGE[e.key];
        if (n) {
          e.preventDefault();
          onSelect?.(i);
          const to = clampItem(item, lv, rot, [from[0] + n[0], from[1] + n[1]]);
          if (ok(to)) onMove?.(i, to);
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          onSelect?.(i);
          onRotate?.(i);
        }
      },
    };
  }

  const sprites: React.ReactNode[] = [];
  let handle = null as { x: number; y: number; i: number; name: string } | null; // set inside the map below

  rooms.forEach((hr, r) => {
    const ox = hr.grid[0] * SIZE;
    const oy = hr.grid[1] * SIZE;
    const active = r === focus && !!onSelect;
    const { places, blockers } = arrangeRoom(hr.room, hr.levels, hr.layout);
    hr.room.items.forEach((item, i) => {
      const lv = hr.levels[i] ?? 0;
      const place = places[i];
      if (lv <= 0 || !place) return;
      const at = active && live?.i === i ? live.at : place.at;
      const stage = stageFor(item, lv);
      const on = active && selected === i;
      // Parts resting on another part (or hung on the wall) share that part's depth.
      const rootOf = (j: number): number => (stage.parts[j].on !== undefined ? rootOf(stage.parts[j].on!) : stage.parts[j].up ? 0 : j);
      const depth: number[] = [];
      let top = Infinity;

      stage.parts.forEach((part, j) => {
        const sprite = rotateSprite(part.s, place.rot);
        const box = spriteBox(sprite);
        const [dx, dy] = rotateOffset(part.at ?? [0, 0], place.rot);
        const fx = ox + at[0] + dx;
        const fy = oy + at[1] + dy;
        const [x, floorY] = iso(fx, fy);
        const y = floorY - partLift(stage.parts, j, place.rot) * S;
        const w = box.w * S;
        const imgTop = y - box.cy * S;
        top = Math.min(top, imgTop);
        depth[j] = Math.round((fx + fy + (box.dx + box.dy) / 2) * 100);
        const style: React.CSSProperties = {
          left: px(x - w / 2),
          top: py(imgTop),
          width: `${(w / WW) * 100}%`,
          zIndex: item.flat ? 10 + j : 100 + depth[rootOf(j)] * 10 + j,
        };
        const img = (
          <Image
            src={`/qn/furniture/${sprite}.png`}
            alt=""
            width={box.w}
            height={box.h}
            unoptimized
            priority={priority}
            draggable={false}
            className="pointer-events-none block h-auto w-full select-none"
          />
        );
        const key = `${hr.room.id}-${item.id}-${stage.from}-${j}`;
        const look = cn(
          "absolute",
          !editing && "animate-in fade-in zoom-in-90 duration-300",
          on && "[filter:drop-shadow(0_0_3px_#ffffff)_drop-shadow(0_0_6px_#2e8a69)]",
        );
        sprites.push(
          active ? (
            <button
              key={key}
              type="button"
              {...editHandlers(i, item, lv, place.rot, place.at, blockers)}
              aria-label={j === 0 ? `${item.name}, level ${lv}${editing ? ". Drag or use the arrow keys to move, R to rotate" : ""}` : undefined}
              aria-hidden={j === 0 ? undefined : true}
              tabIndex={j === 0 ? 0 : -1}
              className={cn(
                look,
                "rounded-md transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[#2e8a69]",
                editing ? "cursor-grab touch-none active:cursor-grabbing" : "cursor-pointer",
              )}
              style={style}
            >
              {img}
            </button>
          ) : (
            <span key={key} className={cn(look, "pointer-events-none")} style={style}>
              {img}
            </span>
          ),
        );
      });

      if (editing && on && !live) handle = { x: iso(ox + at[0], oy + at[1])[0], y: top - 6, i, name: item.name };
    });
  });

  // Tap a room to look at it (any room when zoomed out; the others when zoomed in).
  const roomButtons = onFocus
    ? rooms.map((hr, r) => {
        if (r === focus) return null;
        const b = roomBox(hr.grid);
        const ox = hr.grid[0] * SIZE;
        const oy = hr.grid[1] * SIZE;
        const hl = hr.grid[0] === 0 ? WALL : LOW;
        const hrt = hr.grid[1] === 0 ? WALL : LOW;
        const poly = [
          [iso(ox, oy)[0], iso(ox, oy)[1] - Math.max(hl, hrt)],
          [iso(ox + SIZE, oy)[0], iso(ox + SIZE, oy)[1] - hrt],
          iso(ox + SIZE, oy),
          [iso(ox + SIZE, oy + SIZE)[0], iso(ox + SIZE, oy + SIZE)[1] + T],
          iso(ox, oy + SIZE),
          [iso(ox, oy + SIZE)[0], iso(ox, oy + SIZE)[1] - hl],
        ].map(([x, y]) => `${(((x - b.x0) / (b.x1 - b.x0)) * 100).toFixed(2)}% ${(((y - b.y0) / (b.y1 - b.y0)) * 100).toFixed(2)}%`);
        return (
          <button
            key={`open-${hr.room.id}`}
            type="button"
            aria-label={`Look at the ${hr.room.name.toLowerCase()}`}
            onClick={() => onFocus(r)}
            className="absolute cursor-zoom-in bg-white/0 transition-colors hover:bg-white/15 focus-visible:bg-white/25 focus-visible:outline-none"
            style={{ left: px(b.x0), top: py(b.y0), width: `${((b.x1 - b.x0) / WW) * 100}%`, height: `${((b.y1 - b.y0) / WH) * 100}%`, clipPath: `polygon(${poly.join(",")})`, zIndex: 7000 }}
          />
        );
      })
    : [];

  // Where the "add a room" button sits: on the next room's floor, next to the newest room.
  let slotAt: [number, number] | null = null;
  if (slot) {
    const cx = (slot.grid[0] + 0.5) * SIZE;
    const cy = (slot.grid[1] + 0.5) * SIZE;
    const k = SIZE / 2 - 0.5;
    slotAt = iso(cx + Math.sign(slot.near[0] - slot.grid[0]) * k, cy + Math.sign(slot.near[1] - slot.grid[1]) * k);
  }

  return (
    <div ref={view} className={cn("relative w-full overflow-hidden select-none", className)} style={aspect ? { aspectRatio: aspect } : undefined}>
      <div
        ref={world}
        className={cn("absolute isolate", animate && "transition-[left,top,width,height] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]")}
        style={{
          left: `${((wb.x0 - cam.x) / cam.w) * 100}%`,
          top: `${((wb.y0 - cam.y) / cam.h) * 100}%`,
          width: `${(WW / cam.w) * 100}%`,
          height: `${(WH / cam.h) * 100}%`,
        }}
      >
        <svg viewBox={`${wb.x0} ${wb.y0} ${WW} ${WH}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {slot && <SlotFloor grid={slot.grid} ready={slot.ready} />}
          {rooms.map((hr, r) => (
            <RoomShell key={hr.room.id} room={hr.room} grid={hr.grid} showGrid={editing && r === focus} />
          ))}
        </svg>
        {sprites}
        {roomButtons}
        {slot && slotAt && (
          <button
            type="button"
            onClick={slot.onClick}
            aria-label={slot.ready ? `Buy the ${slot.label.toLowerCase()}` : `${slot.label}: locked, ${slot.progress}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: px(slotAt[0]), top: py(slotAt[1]), zIndex: 7500 }}
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-full border-[3px] border-white shadow-[0_4px_0_rgba(0,0,0,.18)] transition hover:scale-105 md:size-14",
                slot.ready ? "bg-brand text-white" : "bg-card/90 text-muted-foreground",
              )}
            >
              {slot.ready ? <Plus className="size-7" strokeWidth={3} /> : <Lock className="size-5" strokeWidth={2.6} />}
            </span>
            <span className="rounded-full bg-card/95 px-2.5 py-0.5 text-[12px] font-black whitespace-nowrap shadow-sm">
              {slot.label}
              {!slot.ready && <span className="text-muted-foreground"> · {slot.progress}</span>}
            </span>
          </button>
        )}
        {handle && (
          <button
            type="button"
            onClick={() => onRotate?.(handle!.i)}
            aria-label={`Rotate ${handle.name}`}
            title="Rotate"
            className="absolute flex size-10 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-night text-white shadow-[0_3px_0_rgba(0,0,0,.25)] transition hover:brightness-110"
            style={{ left: px(handle.x), top: py(handle.y), zIndex: 8000 }}
          >
            <RotateCw className="size-5" strokeWidth={2.6} />
          </button>
        )}
      </div>
    </div>
  );
}

/** A single room on its own (landing page, previews). */
export function IsoRoom({ room, levels, layout, className }: { room: RoomDef; levels: number[]; layout?: RoomLayout; className?: string }) {
  return <IsoHouse rooms={[{ room, levels, layout, grid: [0, 0] }]} focus={0} aspect={ROOM_ASPECT} className={className} />;
}

const pts = (...p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const up = ([x, y]: [number, number], d: number): [number, number] => [x, y - d];
const down = ([x, y]: [number, number], d: number): [number, number] => [x, y + d];
const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function Window({ a, b }: { a: [number, number]; b: [number, number] }) {
  const win = [up(a, 136), up(b, 136), up(b, 66), up(a, 66)] as [number, number][];
  return (
    <g>
      <polygon points={pts(...win)} fill="#ffffff" />
      <polygon points={pts(...win.map(([x, y], k) => [x + (k === 0 || k === 3 ? 6 : -6), y + (k < 2 ? 6 : -6)] as [number, number]))} fill="#bfe9f5" />
      <line x1={mid(win[0], win[1])[0]} y1={mid(win[0], win[1])[1]} x2={mid(win[3], win[2])[0]} y2={mid(win[3], win[2])[1]} stroke="#ffffff" strokeWidth="5" />
      <line x1={mid(win[0], win[3])[0]} y1={mid(win[0], win[3])[1]} x2={mid(win[1], win[2])[0]} y2={mid(win[1], win[2])[1]} stroke="#ffffff" strokeWidth="5" />
    </g>
  );
}

function RoomShell({ room, grid, showGrid }: { room: RoomDef; grid: [number, number]; showGrid: boolean }) {
  const ox = grid[0] * SIZE;
  const oy = grid[1] * SIZE;
  const p = (x: number, y: number) => iso(ox + x, oy + y);
  const B = p(0, 0);
  const L = p(0, SIZE);
  const R = p(SIZE, 0);
  const F = p(SIZE, SIZE);
  const hl = grid[0] === 0 ? WALL : LOW; // left wall: full on the outside of the house
  const hr = grid[1] === 0 ? WALL : LOW;
  const planks = Array.from({ length: 6 }, (_, k) => (k + 1) * (SIZE / 7));
  const gridLines = Array.from({ length: Math.floor(SIZE * 2) }, (_, k) => (k + 1) / 2);

  return (
    <g>
      <polygon points={pts(L, F, down(F, T), down(L, T))} fill="#7cc7d3" />
      <polygon points={pts(F, R, down(R, T), down(F, T))} fill="#68b6c3" />
      <polygon points={pts(B, R, F, L)} fill={room.floor} />
      {planks.map((t) => (
        <line key={t} x1={p(t, 0)[0]} y1={p(t, 0)[1]} x2={p(t, SIZE)[0]} y2={p(t, SIZE)[1]} stroke={room.floorLine} strokeWidth="2" />
      ))}
      {showGrid &&
        gridLines.map((t) => (
          <g key={`g${t}`} stroke="#ffffff" strokeOpacity=".8" strokeWidth="2" strokeDasharray="6 6">
            <line x1={p(t, 0)[0]} y1={p(t, 0)[1]} x2={p(t, SIZE)[0]} y2={p(t, SIZE)[1]} />
            <line x1={p(0, t)[0]} y1={p(0, t)[1]} x2={p(SIZE, t)[0]} y2={p(SIZE, t)[1]} />
          </g>
        ))}
      <polygon points={pts(up(B, hl), B, L, up(L, hl))} fill={room.wall} />
      <polygon points={pts(up(B, hr), up(R, hr), R, B)} fill={room.wallSide} />
      <polyline points={pts(L, B, R)} fill="none" stroke="#ffffff" strokeOpacity=".7" strokeWidth="5" />
      {hl === WALL && <Window a={p(0, 0.8)} b={p(0, 1.7)} />}
      {hr === WALL && room.id !== "living" && <Window a={p(1.1, 0)} b={p(2.0, 0)} />}
      <polyline points={pts(up(L, hl), up(B, hl))} fill="none" stroke="#7cc7d3" strokeWidth={hl === WALL ? 10 : 7} strokeLinecap="round" />
      <polyline points={pts(up(B, hr), up(R, hr))} fill="none" stroke="#7cc7d3" strokeWidth={hr === WALL ? 10 : 7} strokeLinecap="round" />
      {hl === WALL && hr === WALL && <line x1={B[0]} y1={B[1]} x2={B[0]} y2={B[1] - WALL} stroke="#000" strokeOpacity=".06" strokeWidth="2" />}
      {hl === WALL && <line x1={L[0]} y1={L[1] - WALL} x2={L[0]} y2={L[1] + T} stroke="#7cc7d3" strokeWidth="10" />}
      {hr === WALL && <line x1={R[0]} y1={R[1] - WALL} x2={R[0]} y2={R[1] + T} stroke="#68b6c3" strokeWidth="10" />}
    </g>
  );
}

/** The next room's floor, waiting to be bought. */
function SlotFloor({ grid, ready }: { grid: [number, number]; ready: boolean }) {
  const ox = grid[0] * SIZE;
  const oy = grid[1] * SIZE;
  const p = (x: number, y: number) => iso(ox + x, oy + y);
  return (
    <polygon
      points={pts(p(0.08, 0.08), p(SIZE - 0.08, 0.08), p(SIZE - 0.08, SIZE - 0.08), p(0.08, SIZE - 0.08))}
      fill={ready ? "#e2f3eb" : "#ffffff"}
      fillOpacity={ready ? 0.85 : 0.45}
      stroke={ready ? "#2e8a69" : "#ffffff"}
      strokeWidth="4"
      strokeDasharray="14 10"
    />
  );
}
