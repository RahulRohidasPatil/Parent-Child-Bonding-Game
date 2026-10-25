export type Room = {
  id: string;
  code: string;
  host_id: string;
  capacity: number;
  version: number;
  closed: boolean;
  expires_at: string;
  members: { user_id: string; display_name: string; ready: boolean }[];
};
export type LessonSummary = {
  id: string;
  title?: string;
  status?: "draft" | "approved";
  revision?: number;
};
export type LessonPage = { items: LessonSummary[]; next_cursor: string | null };
export type DiagramLesson = {
  id: string;
  title: string;
  status: "draft" | "approved";
  revision: number;
  visuals: {
    id: string;
    kind: "diagram" | "chart" | "interactive";
    title: string;
  }[];
};
export type Template = {
  id: string;
  lesson_id: string;
  visual_id: string;
  slots: number;
  source_hash: string;
};
export type RaceStatus =
  | "waiting"
  | "countdown"
  | "running"
  | "finished"
  | "expired"
  | "cancelled";
export type SourceAvailability = {
  available: boolean;
  reason: "source_unavailable" | "source_unapproved" | "source_changed" | null;
};
export type Race = {
  id: string;
  room_id: string;
  version: number;
  status: RaceStatus;
  question: string;
  total: number;
  started_at: number | null;
  deadline_at: number | null;
  server_now: number;
  my_player_id: string;
  reason: string | null;
  source: SourceAvailability;
  players: {
    id: string;
    display_name: string;
    placed: number;
    completed: boolean;
    forfeited: boolean;
  }[];
};
export type RaceManagement = {
  room_id: string;
  race_id: string;
  version: number;
  status: RaceStatus;
  reason: string | null;
};
export type Study = {
  id: string;
  question: string;
  reference_svg: string;
  view_box: string;
};
export type DiagramCard = { id: string; text: string };
export type DiagramSlot = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
export type Board = {
  id: string;
  question: string;
  puzzle_svg: string;
  view_box: string;
  slots: DiagramSlot[];
  cards: DiagramCard[];
  placements: Record<string, string>;
  version: number;
  started_at: number;
  deadline_at: number;
  server_now: number;
};
export type PlayerAction = {
  id: string;
  version: number;
  placed: number;
  total: number;
  completed: boolean;
  elapsed_ms: number | null;
  submissions: number;
  correct_count: number | null;
  incorrect_slot_ids: string[] | null;
  forfeited: boolean;
};
export type Results = {
  id: string;
  status: "finished" | "expired";
  winner_ids: string[];
  scoring: "fastest_correct_server_elapsed";
  source: SourceAvailability;
  players: {
    id: string;
    display_name: string;
    completed: boolean;
    elapsed_ms: number | null;
    rank: number | null;
    forfeited: boolean;
    submissions: number;
  }[];
};
export type Review = Results & {
  reference_svg: string;
  solution: { slot_id: string; text: string }[];
};
export type RaceAction = {
  id: string;
  version: number;
  status: RaceStatus;
  started_at: number | null;
  deadline_at: number | null;
  reason?: string | null;
};

export class DiagramApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfterMs = 0,
  ) {
    super(message);
  }
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
const encode = encodeURIComponent;
const pendingKeys = new Map<string, string>();
function actionKey(identity: string) {
  const storageKey = "qn.diagram.action." + identity;
  try {
    const previous = sessionStorage.getItem(storageKey);
    if (previous) return previous;
  } catch {
    /* optional */
  }
  const key = pendingKeys.get(identity) ?? crypto.randomUUID();
  pendingKeys.set(identity, key);
  try {
    sessionStorage.setItem(storageKey, key);
  } catch {
    /* Memory still supports exact retries. */
  }
  return key;
}
function clearActionKey(identity: string) {
  pendingKeys.delete(identity);
  try {
    sessionStorage.removeItem("qn.diagram.action." + identity);
  } catch {
    /* optional */
  }
}
export function createDiagramApi(
  playerId: string,
  fetcher: typeof fetch = fetch,
) {
  let blockedUntil = 0;
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (Date.now() < blockedUntil)
      throw new DiagramApiError(
        429,
        "Taking a short pause before retrying.",
        blockedUntil - Date.now(),
      );
    let response: Response;
    try {
      response = await fetcher("/api/" + path, {
        ...init,
        cache: "no-store",
        headers: { ...init.headers, "X-Player-ID": playerId },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        throw error;
      throw new DiagramApiError(
        0,
        "Connection lost. Retry when you are back online.",
      );
    }
    if (!response.ok) {
      let detail = "";
      try {
        const body = await response.json();
        detail =
          typeof body.detail === "string"
            ? body.detail
            : Array.isArray(body.detail)
              ? body.detail
                  .map((item: { msg?: string }) => item.msg)
                  .filter(Boolean)
                  .join(". ")
              : "";
      } catch {
        /* Gateway errors may not be JSON. */
      }
      const retry = response.headers.get("retry-after");
      const retryAfterMs = retry
        ? Math.max(
            0,
            /^\d+(\.\d+)?$/.test(retry)
              ? Number(retry) * 1000
              : Date.parse(retry) - Date.now(),
          )
        : 0;
      if (response.status === 429)
        blockedUntil = Date.now() + Math.max(3000, retryAfterMs || 0);
      const fallback: Record<number, string> = {
        401: "Your session ended. Please sign in again.",
        403: "This action is not available to you.",
        404: "This room, round, or diagram is no longer available to this player.",
        409: "The state changed. Refresh and try again.",
        422: "This diagram or action is not supported.",
        429: "Too many requests. Wait a moment before trying again.",
        503: "Diagram Assembly is unavailable. The server may still need feature setup.",
      };
      throw new DiagramApiError(
        response.status,
        detail ||
          fallback[response.status] ||
          "The server could not complete this request.",
        Number.isFinite(retryAfterMs) ? retryAfterMs : 0,
      );
    }
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }
  async function write<T>(
    path: string,
    body: unknown,
    method = "POST",
    idempotent = true,
  ) {
    const json = JSON.stringify(body);
    const identity = playerId + ":" + method + ":" + path + ":" + json;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (idempotent) headers["Idempotency-Key"] = actionKey(identity);
    try {
      const result = await request<T>(path, { method, headers, body: json });
      if (idempotent) clearActionKey(identity);
      return result;
    } catch (error) {
      // An uncertain failure may have committed. Keep its key for an identical retry.
      if (
        idempotent &&
        error instanceof DiagramApiError &&
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 429
      )
        clearActionKey(identity);
      throw error;
    }
  }
  const racePath = (id: string, suffix = "") =>
    "diagram-assembly/races/" + encode(id) + suffix;
  return {
    lessons: (after = "", signal?: AbortSignal) =>
      request<LessonPage>("resources/lessons?limit=50&after=" + encode(after), {
        signal,
      }),
    lesson: (id: string, signal?: AbortSignal) =>
      request<DiagramLesson>("lessons/" + encode(id), { signal }),
    approveLesson: (id: string, expected_revision: number) =>
      write<{ id: string; status: "approved" }>(
        "lessons/" + encode(id) + "/approve",
        { expected_revision, confirmed: true },
        "POST",
        false,
      ),
    prepare: (lesson_id: string, visual_id: string) =>
      write<Template>("diagram-assembly/templates", { lesson_id, visual_id }),
    template: (id: string) =>
      request<Template>("diagram-assembly/templates/" + encode(id)),
    createRoom: (display_name: string) =>
      write<Room>("rooms", { display_name, capacity: 8 }, "POST", false),
    join: (code: string, display_name: string) =>
      write<Room>("rooms/join", { code, display_name }, "POST", false),
    room: (id: string, signal?: AbortSignal) =>
      request<Room>("rooms/" + encode(id), { signal }),
    roomCommand: (
      id: string,
      expected_version: number,
      action: "ready" | "leave" | "close",
      ready = false,
    ) =>
      write<Room | { left: true }>(
        "rooms/" + encode(id) + "/commands",
        { expected_version, action, ready },
        "POST",
        false,
      ),
    createRace: (
      room_id: string,
      template_id: string,
      expected_room_version: number,
    ) =>
      write<{
        id: string;
        room_id: string;
        version: number;
        status: RaceStatus;
      }>("diagram-assembly/races", {
        room_id,
        template_id,
        expected_room_version,
      }),
    currentRace: (roomId: string, signal?: AbortSignal) =>
      request<Race>("diagram-assembly/rooms/" + encode(roomId) + "/race", {
        signal,
      }),
    management: (roomId: string, signal?: AbortSignal) =>
      request<RaceManagement>(
        "diagram-assembly/rooms/" + encode(roomId) + "/management",
        { signal },
      ),
    race: (id: string, signal?: AbortSignal) =>
      request<Race>(racePath(id), { signal }),
    study: (id: string, signal?: AbortSignal) =>
      request<Study>(racePath(id, "/study"), { signal }),
    board: (id: string, signal?: AbortSignal) =>
      request<Board>(racePath(id, "/board"), { signal }),
    save: (
      id: string,
      expected_version: number,
      placements: Record<string, string>,
    ) =>
      write<PlayerAction>(
        racePath(id, "/placements"),
        { expected_version, placements },
        "PUT",
      ),
    finish: (id: string, expected_version: number) =>
      write<PlayerAction>(racePath(id, "/finish"), { expected_version }),
    forfeit: (id: string, expected_version: number) =>
      write<PlayerAction>(racePath(id, "/forfeit"), { expected_version }),
    start: (id: string, expected_version: number) =>
      write<RaceAction>(racePath(id, "/start"), { expected_version }),
    cancel: (id: string, expected_version: number) =>
      write<RaceAction>(racePath(id, "/cancel"), { expected_version }),
    results: (id: string, signal?: AbortSignal) =>
      request<Results>(racePath(id, "/results"), { signal }),
    review: (id: string) => request<Review>(racePath(id, "/review")),
  };
}
