/**
 * The home: one shared space that grows room by room. Each room holds a few items; an item is
 * placed for PLACE_COST, then levelled 1–10 with coins, and its look changes at certain levels.
 * When every item in the newest room is placed and at UNLOCK_LEVEL or higher, the next room can
 * be bought. Kids can drag and rotate furniture to arrange each room. Cosmetic only: never
 * affects scores. Art: Kenney Furniture Kit (CC0), in public/qn/furniture.
 *
 * Floor coordinates are in tiles from the back corner: x runs along the right-hand wall, y along
 * the left-hand wall. Kenney's views face: SW → +y (back to the right wall), SE → +x (back to the
 * left wall), NW → −y, NE → −x.
 */
import { SPRITE_SIZE } from "./furniture-sizes";

export type RoomId = "living" | "kitchen" | "bedroom" | "bathroom";

type SpriteName = keyof typeof SPRITE_SIZE;
/**
 * One sprite of an item's look. `at` moves it on the floor (tiles, relative to the item). `on`
 * sets it on top of another part (by index); `up` lifts it by a fixed amount (px) instead.
 */
export type Part = { s: SpriteName; at?: [number, number]; on?: number; up?: number };
export type Stage = { from: number; parts: Part[] };
export type HomeItem = {
  id: string;
  name: string;
  /** Centre of the item on the floor. A 0 on either axis means "pushed against that wall". */
  at: [number, number];
  /** Rugs: drawn under everything else. */
  flat?: boolean;
  /** Nudge (tiles) for the "place me" marker when it would sit on another item's marker. */
  slot?: [number, number];
  starter?: boolean;
  /** Which part of a stage to show as the item's thumbnail (default: the first). */
  thumb?: number;
  stages: Stage[];
};
export type RoomDef = {
  id: RoomId;
  name: string;
  blurb: string;
  wall: string;
  wallSide: string;
  floor: string;
  floorLine: string;
  items: HomeItem[];
};

export const MAX_LEVEL = 10;
export const PLACE_COST = 30;
/** The next room opens once every item in the newest room is placed and at this level (30%). */
export const UNLOCK_LEVEL = Math.ceil(MAX_LEVEL * 0.3);
export const UPGRADE_COST = (nextLevel: number) => 20 * nextLevel;

const st = (from: number, ...parts: (Part | SpriteName)[]): Stage => ({
  from,
  parts: parts.map((p) => (typeof p === "string" ? { s: p } : p)),
});
const rug = (): Stage[] => [st(1, "rugDoormat_SE"), st(4, "rugRound_SE"), st(7, "rugSquare_SE"), st(10, "rugRounded_SE")];
const plant = (dir: "SE" | "SW"): Stage[] => [
  st(1, `pottedPlant_${dir}`),
  st(5, `pottedPlant_${dir}`, { s: `pottedPlant_${dir}`, at: [0.22, 0.22] }),
  st(9, `pottedPlant_${dir}`, { s: `pottedPlant_${dir}`, at: [0.22, 0.22] }, { s: `pottedPlant_${dir}`, at: [-0.05, 0.4] }),
];
const lamp = (dir: "SE" | "SW"): Stage[] => [st(1, `lampSquareFloor_${dir}`), st(5, `lampRoundFloor_${dir}`)];

export const ROOMS: RoomDef[] = [
  {
    id: "living",
    name: "Living room",
    blurb: "Where it all starts: an old TV and a basic sofa.",
    wall: "#d9ecd2",
    wallSide: "#c4dfba",
    floor: "#eeab6c",
    floorLine: "#dd9a5c",
    items: [
      {
        id: "tv",
        name: "TV",
        at: [1.55, 0],
        starter: true,
        thumb: 1,
        stages: [
          st(1, "cardboardBoxClosed_SW", { s: "televisionVintage_SW", on: 0 }),
          st(4, "sideTableDrawers_SW", { s: "televisionVintage_SW", on: 0 }),
          st(7, "cabinetTelevision_SW", { s: "televisionModern_SW", on: 0 }),
          st(10, "cabinetTelevisionDoors_SW", { s: "televisionModern_SW", on: 0 }, { s: "speaker_SW", at: [-0.56, 0] }, { s: "speaker_SW", at: [0.56, 0] }),
        ],
      },
      {
        id: "sofa",
        name: "Sofa",
        at: [0, 1.35],
        starter: true,
        stages: [st(1, "loungeSofa_SE"), st(4, "loungeDesignSofa_SE"), st(7, "loungeSofaLong_SE"), st(10, "loungeSofaLong_SE", { s: "loungeSofaOttoman_SE", at: [0.6, -0.45] })],
      },
      {
        id: "table",
        name: "Coffee table",
        at: [1.2, 1.4],
        stages: [st(1, "tableCoffeeSquare_SE"), st(4, "tableCoffee_SE"), st(7, "tableCoffeeGlassSquare_SE"), st(10, "tableCoffeeGlass_SE", { s: "books_SE", on: 0 })],
      },
      { id: "rug", name: "Rug", at: [1.2, 1.4], flat: true, slot: [0.45, 0.45], stages: rug() },
      {
        id: "shelf",
        name: "Bookshelf",
        at: [0, 0.3],
        stages: [st(1, "bookcaseOpenLow_SE"), st(4, "bookcaseOpen_SE"), st(7, "bookcaseClosed_SE"), st(10, "bookcaseClosedWide_SE", { s: "books_SE", on: 0 })],
      },
      {
        id: "armchair",
        name: "Armchair",
        at: [0, 2.4],
        stages: [st(1, "chairCushion_SE"), st(4, "chairRounded_SE"), st(7, "loungeChair_SE"), st(10, "loungeChairRelax_SE")],
      },
      { id: "lamp", name: "Floor lamp", at: [0.3, 0], stages: lamp("SW") },
      { id: "plant", name: "Plants", at: [2.45, 0], stages: plant("SW") },
    ],
  },
  {
    id: "kitchen",
    name: "Kitchen",
    blurb: "Cook up snacks between study sessions.",
    wall: "#fdf1d6",
    wallSide: "#f3e2bb",
    floor: "#cfd8dc",
    floorLine: "#bcc7cc",
    items: [
      {
        id: "fridge",
        name: "Fridge",
        at: [0.3, 0],
        starter: true,
        stages: [st(1, "kitchenFridgeSmall_SW"), st(4, "kitchenFridge_SW"), st(7, "kitchenFridgeBuiltIn_SW"), st(10, "kitchenFridgeLarge_SW")],
      },
      {
        id: "stove",
        name: "Stove",
        at: [0.9, 0],
        starter: true,
        stages: [
          st(1, "kitchenStoveElectric_SW"),
          st(4, "kitchenStove_SW"),
          st(7, "kitchenStove_SW", { s: "hoodModern_SW", at: [0, -0.08], up: 92 }),
          st(10, "kitchenStove_SW", { s: "hoodLarge_SW", at: [0, -0.08], up: 92 }),
        ],
      },
      {
        id: "sink",
        name: "Sink",
        at: [1.45, 0],
        stages: [
          st(1, "kitchenCabinet_SW"),
          st(4, "kitchenSink_SW"),
          st(7, "kitchenSink_SW", { s: "kitchenCabinetDrawer_SW", at: [0.47, 0] }),
          st(10, "kitchenSink_SW", { s: "kitchenCabinetDrawer_SW", at: [0.47, 0] }, { s: "kitchenCoffeeMachine_SW", at: [0.47, 0], on: 1 }),
        ],
      },
      {
        id: "counter",
        name: "Counter",
        at: [0, 1.15],
        stages: [
          st(1, "kitchenBar_SE", { s: "toaster_SE", on: 0 }),
          st(4, "kitchenBar_SE", { s: "kitchenBlender_SE", on: 0 }),
          st(7, "kitchenCabinetDrawer_SE", { s: "kitchenMicrowave_SE", on: 0 }),
          st(10, "kitchenCabinetDrawer_SE", { s: "kitchenMicrowave_SE", on: 0 }, { s: "kitchenCabinetDrawer_SE", at: [0, 0.47] }, { s: "kitchenCoffeeMachine_SE", at: [0, 0.47], on: 2 }),
        ],
      },
      {
        id: "dining",
        name: "Dining table",
        at: [1.65, 1.6],
        stages: [st(1, "tableRound_SE"), st(4, "table_SE"), st(7, "tableCloth_SE"), st(10, "tableCrossCloth_SE")],
      },
      {
        id: "chairs",
        name: "Chairs",
        at: [1.05, 1.6],
        stages: [
          st(1, { s: "stoolBarSquare_SE", at: [0, -0.25] }, { s: "stoolBarSquare_SE", at: [0, 0.25] }),
          st(4, { s: "chair_SE", at: [0, -0.25] }, { s: "chair_SE", at: [0, 0.25] }),
          st(7, { s: "chairCushion_SE", at: [0, -0.25] }, { s: "chairCushion_SE", at: [0, 0.25] }),
          st(10, { s: "chairRounded_SE", at: [0, -0.25] }, { s: "chairRounded_SE", at: [0, 0.25] }),
        ],
      },
      {
        id: "pantry",
        name: "Pantry",
        at: [0, 2.3],
        stages: [st(1, "bookcaseOpenLow_SE"), st(4, "bookcaseOpen_SE"), st(7, "bookcaseClosed_SE"), st(10, "bookcaseClosedDoors_SE")],
      },
      { id: "plant", name: "Plants", at: [2.5, 0], stages: plant("SW") },
    ],
  },
  {
    id: "bedroom",
    name: "Bedroom",
    blurb: "A cosy place to rest after a long streak.",
    wall: "#e3e0f7",
    wallSide: "#d2cdf0",
    floor: "#d99a62",
    floorLine: "#c98a54",
    items: [
      {
        id: "bed",
        name: "Bed",
        at: [0, 1.25],
        starter: true,
        stages: [
          st(1, "bedSingle_SE"),
          st(4, "bedSingle_SE", { s: "bear_SE", at: [-0.3, 0], up: 30 }),
          st(7, "bedDouble_SE"),
          st(10, "bedDouble_SE", { s: "pillow_SE", at: [-0.35, -0.2], up: 32 }, { s: "pillowBlue_SE", at: [-0.35, 0.2], up: 32 }),
        ],
      },
      {
        id: "nightstand",
        name: "Nightstand",
        at: [0, 0.45],
        starter: true,
        stages: [st(1, "cabinetBed_SE"), st(4, "cabinetBedDrawer_SE"), st(7, "cabinetBedDrawerTable_SE"), st(10, "cabinetBedDrawerTable_SE", { s: "lampSquareTable_SE", on: 0 })],
      },
      {
        id: "wardrobe",
        name: "Wardrobe",
        at: [2.15, 0],
        stages: [
          st(1, "cardboardBoxClosed_SW", { s: "cardboardBoxOpen_SW", at: [0.3, 0.1] }),
          st(4, "bookcaseClosedDoors_SW"),
          st(7, "bookcaseClosedWide_SW"),
          st(10, "bookcaseClosedWide_SW", { s: "coatRackStanding_SW", at: [-0.55, 0.15] }),
        ],
      },
      {
        id: "desk",
        name: "Desk",
        at: [1.15, 0],
        stages: [
          st(1, "sideTable_SW"),
          st(4, "desk_SW", { s: "chairDesk_NW", at: [0, 0.45] }),
          st(7, "desk_SW", { s: "laptop_SW", on: 0 }, { s: "chairDesk_NW", at: [0, 0.45] }),
          st(10, "desk_SW", { s: "computerScreen_SW", on: 0 }, { s: "chairDesk_NW", at: [0, 0.45] }),
        ],
      },
      { id: "rug", name: "Rug", at: [1.45, 1.6], flat: true, slot: [0.35, -0.3], stages: rug() },
      {
        id: "toys",
        name: "Toy corner",
        at: [2.25, 2.25],
        stages: [
          st(1, "bear_SE"),
          st(4, "bear_SE", { s: "pillow_SE", at: [0.25, -0.2] }),
          st(7, "bear_SE", { s: "pillow_SE", at: [0.25, -0.2] }, { s: "pillowBlue_SE", at: [-0.2, 0.25] }),
          st(10, "bear_SE", { s: "pillow_SE", at: [0.25, -0.2] }, { s: "pillowBlue_SE", at: [-0.2, 0.25] }, { s: "radio_SE", at: [0.25, 0.3] }),
        ],
      },
      { id: "lamp", name: "Floor lamp", at: [0, 2.15], stages: lamp("SE") },
      {
        id: "books",
        name: "Bookshelf",
        at: [0.4, 0],
        stages: [st(1, "bookcaseOpenLow_SW"), st(4, "bookcaseOpen_SW"), st(7, "bookcaseClosed_SW"), st(10, "bookcaseClosed_SW", { s: "books_SW", on: 0 })],
      },
    ],
  },
  {
    id: "bathroom",
    name: "Bathroom",
    blurb: "Splish splash, the finishing touch.",
    wall: "#d6eef7",
    wallSide: "#bfe2ef",
    floor: "#f3f6f8",
    floorLine: "#dfe6ea",
    items: [
      {
        id: "toilet",
        name: "Toilet",
        at: [0.35, 0],
        starter: true,
        stages: [
          st(1, "toilet_SW"),
          st(4, "toiletSquare_SW"),
          st(7, "toiletSquare_SW", { s: "trashcan_SW", at: [0.4, 0] }),
          st(10, "toiletSquare_SW", { s: "trashcan_SW", at: [0.4, 0] }, { s: "plantSmall2_SW", at: [0, -0.12], up: 62 }),
        ],
      },
      {
        id: "sink",
        name: "Sink",
        at: [1.0, 0],
        starter: true,
        stages: [
          st(1, "bathroomSink_SW"),
          st(4, "bathroomSinkSquare_SW"),
          st(7, "bathroomCabinetDrawer_SW"),
          st(10, "bathroomCabinetDrawer_SW", { s: "bathroomMirror_SW", at: [0, -0.1], up: 70 }),
        ],
      },
      {
        id: "bath",
        name: "Bath",
        at: [0, 1.35],
        stages: [st(1, "shower_SE"), st(4, "showerRound_SE"), st(7, "bathtub_SE"), st(10, "bathtub_SE", { s: "rugDoormat_SE", at: [0.6, 0] })],
      },
      {
        id: "washer",
        name: "Washer",
        at: [1.8, 0],
        stages: [st(1, "washer_SW"), st(4, "dryer_SW"), st(7, "washerDryerStacked_SW"), st(10, "washerDryerStacked_SW", { s: "washer_SW", at: [0.45, 0] })],
      },
      {
        id: "shelf",
        name: "Towel shelf",
        at: [0, 2.4],
        stages: [st(1, "bookcaseOpenLow_SE"), st(4, "bookcaseOpen_SE"), st(7, "bookcaseClosed_SE"), st(10, "bookcaseClosed_SE", { s: "pottedPlant_SE", at: [0.35, 0] })],
      },
      { id: "mat", name: "Bath mat", at: [1.45, 1.55], flat: true, stages: rug() },
      {
        id: "cabinet",
        name: "Cabinet",
        at: [2.6, 1.3],
        stages: [st(1, "bathroomCabinet_NE"), st(4, "bathroomCabinetDrawer_NE"), st(8, "bathroomCabinetDrawer_NE", { s: "plantSmall2_NE", on: 0 })],
      },
      { id: "plant", name: "Plants", at: [2.45, 2.45], stages: plant("SE") },
    ],
  },
];

/** Where each room sits in the house (in rooms, from the back corner), in unlock order. */
export const ROOM_GRID: Record<RoomId, [number, number]> = { living: [0, 0], kitchen: [1, 0], bedroom: [1, 1], bathroom: [0, 1] };

export const roomOf = (id: RoomId) => ROOMS.find((r) => r.id === id) ?? ROOMS[0];

/** Build cost of the n-th room (0 = living room, free). */
export const BUILD_COST = (index: number) => 250 * index;

export function stageFor(item: HomeItem, level: number): Stage {
  let pick = item.stages[0];
  for (const s of item.stages) if (level >= s.from) pick = s;
  return pick;
}

/** The next level at which this item gets a new look, if any. */
export function nextLook(item: HomeItem, level: number): number | null {
  return item.stages.find((s) => s.from > level)?.from ?? null;
}

/** Levels for a freshly built room: starters at Lv 1, the rest waiting to be placed (0). */
export const freshLevels = (room: RoomDef) => room.items.map((i) => (i.starter ? 1 : 0));

/** Saved levels lined up with the room's items (rooms saved before items were added get 0s). */
export const levelsOf = (room: RoomDef, saved?: number[]) => (saved ? room.items.map((_, i) => saved[i] ?? 0) : freshLevels(room));

/** How close a room is to unlocking the next one: items placed and at UNLOCK_LEVEL+. */
export function unlockProgress(room: RoomDef, levels: number[]) {
  const need = room.items.length;
  const have = room.items.filter((_, i) => (levels[i] ?? 0) >= UNLOCK_LEVEL).length;
  return { need, have, ready: have >= need };
}

// ---------- geometry ----------

/** In the Kenney renders, half a floor tile is 103.5 px wide and 73 px tall. */
export const TILE_HW = 103.5;
export const TILE_HH = 73;
/** Floor size in tiles. */
export const FLOOR_TILES = 2.7;
/** Gap kept between furniture and the walls / floor edge (tiles). */
const EDGE = 0.03;

/** Kenney's four views, a quarter turn apart: facing +y, +x, −y, −x. */
const DIRS = ["SW", "SE", "NW", "NE"] as const;

export function rotateSprite(s: SpriteName, rot: number): SpriteName {
  const dir = s.slice(-2) as (typeof DIRS)[number];
  return `${s.slice(0, -2)}${DIRS[(DIRS.indexOf(dir) + rot) % 4]}` as SpriteName;
}

/** Turn a part's floor offset with the item, a quarter turn at a time (+y → +x → −y → −x). */
export function rotateOffset([dx, dy]: [number, number], rot: number): [number, number] {
  let v: [number, number] = [dx, dy];
  for (let k = 0; k < rot % 4; k++) v = [v[1], -v[0]];
  return v;
}

/**
 * A sprite's floor footprint, measured from the image. Two estimates of how far it reaches along x
 * (`dx`) and y (`dy`): from the x of its lowest pixel (`fx`), and from where its left and right
 * corners touch the floor (`yl`, `yr`), which catches L-shapes like corner sofas. The larger of
 * each wins, so furniture never pokes into walls or other furniture. The footprint's centre is
 * at (w/2, `cy`) in the image, and `height` is how tall the object stands (px).
 */
export function spriteBox(s: SpriteName) {
  const [w, h, fx, yl, yr] = SPRITE_SIZE[s];
  const floorH = (w * TILE_HH) / TILE_HW;
  const span = w / TILE_HW;
  const tilt = (yr - yl) / TILE_HH;
  return {
    w,
    h,
    dx: Math.max(fx / TILE_HW, (span + tilt) / 2),
    dy: Math.max((w - fx) / TILE_HW, (span - tilt) / 2),
    cy: h - floorH / 2,
    height: h - floorH,
  };
}

/** How high a part is lifted (px, in sprite pixels): onto another part, or by a fixed amount. */
export function partLift(parts: Part[], j: number, rot: number): number {
  const p = parts[j];
  if (p.on !== undefined) return spriteBox(rotateSprite(parts[p.on].s, rot)).height + partLift(parts, p.on, rot);
  return p.up ?? 0;
}

/** Floor area an item covers (tiles, relative to its centre) for a level and rotation. */
export function footprint(item: HomeItem, level: number, rot: number) {
  const f = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const part of stageFor(item, Math.max(level, 1)).parts) {
    if (part.on !== undefined || part.up) continue; // sits on something or hangs on the wall
    const b = spriteBox(rotateSprite(part.s, rot));
    const [ox, oy] = rotateOffset(part.at ?? [0, 0], rot);
    f.x0 = Math.min(f.x0, ox - b.dx / 2);
    f.x1 = Math.max(f.x1, ox + b.dx / 2);
    f.y0 = Math.min(f.y0, oy - b.dy / 2);
    f.y1 = Math.max(f.y1, oy + b.dy / 2);
  }
  return f;
}

/** Keep an item's whole footprint on the floor, snapped to 0.05 tiles. */
export function clampItem(item: HomeItem, level: number, rot: number, [x, y]: [number, number]): [number, number] {
  const f = footprint(item, level, rot);
  const snap = (v: number) => Math.round(v * 20) / 20;
  const fit = (v: number, lo: number, hi: number) => {
    const min = EDGE - lo;
    const max = FLOOR_TILES - EDGE - hi;
    const c = min > max ? (min + max) / 2 : Math.min(max, Math.max(min, v));
    return Math.round(c * 1000) / 1000;
  };
  return [fit(snap(x), f.x0, f.x1), fit(snap(y), f.y0, f.y1)];
}

// ---------- arranging furniture ----------

/** Where a kid moved an item, and how many quarter turns they rotated it. */
export type Placement = { at: [number, number]; rot: number };
export type RoomLayout = Record<string, Placement>;

export function placementOf(item: HomeItem, layout?: RoomLayout): Placement {
  return layout?.[item.id] ?? { at: item.at, rot: 0 };
}

type Rect = { x0: number; x1: number; y0: number; y1: number };
/** An item's floor area at a spot (tiles, in room coordinates). */
export function rectAt(item: HomeItem, level: number, rot: number, [x, y]: [number, number]): Rect {
  const f = footprint(item, level, rot);
  return { x0: x + f.x0, x1: x + f.x1, y0: y + f.y0, y1: y + f.y1 };
}
const GAP = 0.02;
const hit = (a: Rect, b: Rect) => a.x0 < b.x1 - GAP && b.x0 < a.x1 - GAP && a.y0 < b.y1 - GAP && b.y0 < a.y1 - GAP;

/** Something already on the floor: rugs only block rugs, furniture only blocks furniture. */
export type Blocker = { i: number; rect: Rect; flat: boolean };

export function fits(item: HomeItem, level: number, rot: number, at: [number, number], blockers: Blocker[], self?: number) {
  const r = rectAt(item, level, rot, at);
  return !blockers.some((b) => b.i !== self && b.flat === !!item.flat && hit(r, b.rect));
}

/** The free spot closest to `near` (searching outward in small steps), or `near` if the room is full. */
export function freeSpot(item: HomeItem, level: number, rot: number, near: [number, number], blockers: Blocker[], self?: number): [number, number] {
  const start = clampItem(item, level, rot, near);
  if (fits(item, level, rot, start, blockers, self)) return start;
  for (let ring = 1; ring <= 30; ring++) {
    const d = ring * 0.1;
    let best: [number, number] | null = null;
    let bestDist = Infinity;
    for (let k = -ring; k <= ring; k++) {
      for (const [ox, oy] of [[k * 0.1, -d], [k * 0.1, d], [-d, k * 0.1], [d, k * 0.1]] as [number, number][]) {
        const c = clampItem(item, level, rot, [start[0] + ox, start[1] + oy]);
        const dist = Math.hypot(c[0] - start[0], c[1] - start[1]);
        if (dist < bestDist && fits(item, level, rot, c, blockers, self)) {
          best = c;
          bestDist = dist;
        }
      }
    }
    if (best) return best;
  }
  return start;
}

/**
 * Where every placed item in a room actually stands: items the kid moved keep their spot first,
 * then the rest. Anything that would overlap (say, after an upgrade made something bigger) slides
 * to the nearest free spot, and nothing leaves the floor.
 */
export function arrangeRoom(room: RoomDef, levels: number[], layout?: RoomLayout) {
  const out: (Placement | null)[] = room.items.map(() => null);
  const blockers: Blocker[] = [];
  const order = room.items.map((_, i) => i).sort((a, b) => Number(!layout?.[room.items[a].id]) - Number(!layout?.[room.items[b].id]) || a - b);
  for (const i of order) {
    const lv = levels[i] ?? 0;
    if (lv <= 0) continue;
    const item = room.items[i];
    const p = placementOf(item, layout);
    const at = freeSpot(item, lv, p.rot, p.at, blockers);
    out[i] = { at, rot: p.rot };
    blockers.push({ i, rect: rectAt(item, lv, p.rot, at), flat: !!item.flat });
  }
  return { places: out, blockers };
}

// ---------- friends' homes (examples until the backend stores homes) ----------

export type HomeSnapshot = { rooms: Partial<Record<RoomId, number[]>>; layout?: Partial<Record<RoomId, RoomLayout>> };

export const FRIEND_HOMES: Record<string, HomeSnapshot> = {
  zara: {
    rooms: { living: [10, 9, 8, 10, 7, 9, 6, 9], kitchen: [7, 6, 5, 6, 4, 5, 3, 4], bedroom: [3, 2, 1, 0, 1, 0, 0, 0] },
    layout: {
      living: { armchair: { at: [2.2, 2.1], rot: 3 }, shelf: { at: [2.3, 0], rot: 3 }, tv: { at: [1.15, 0], rot: 0 } },
      bedroom: { bed: { at: [0, 1.6], rot: 0 } },
    },
  },
  mia: {
    rooms: { living: [6, 5, 4, 3, 4, 3, 3, 2], kitchen: [2, 1, 1, 0, 0, 0, 0, 0] },
    layout: { living: { tv: { at: [0, 1.4], rot: 1 }, sofa: { at: [1.4, 0], rot: 3 }, table: { at: [1.4, 1.2], rot: 3 }, rug: { at: [1.4, 1.2], rot: 1 } } },
  },
  leo: { rooms: { living: [4, 3, 2, 1, 2, 0, 1, 0] } },
  sam: { rooms: { living: [2, 1, 0, 0, 0, 0, 0, 0] } },
};

export const homeIdOf = (name: string) => (FRIEND_HOMES[name.toLowerCase()] ? name.toLowerCase() : null);

export function homeSummary(home: HomeSnapshot) {
  const built = ROOMS.filter((r) => home.rooms[r.id]);
  const levels = built.reduce((n, r) => n + (home.rooms[r.id] ?? []).reduce((a, b) => a + b, 0), 0);
  return { built, levels, maxLevels: built.reduce((n, r) => n + r.items.length * MAX_LEVEL, 0) };
}
