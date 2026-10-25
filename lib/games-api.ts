import { http, ApiError } from "./learn-api";
export type Game = "mcq" | "heads_up" | "diagram";
export type Mode = "solo" | "friends" | "parent_child" | "duo";
export type Room = { id: string; code: string; host_id: string; capacity: number; version: number; closed: boolean; expires_at: string; members: { user_id: string; display_name: string; ready: boolean }[] };
export type Match = { id: string; challenge_id: string; game: Game; mode: Mode; topic: string; phase: string; can_start: boolean; server_time_ms: number; play_at_ms: number | null; you: string; players: { player_id: string; name: string; role: string | null; team: number | null }[]; view: {
  question?: { index: number; question: string; options: string[]; answered: boolean; your_closes_at_ms: number } | null;
  reveals?: { index: number; question: string; options: string[]; answer_index: number; explanation: string }[];
  scores?: { name: string; correct?: number; score?: number }[];
  turn?: { index: number; guesser: string; explainer: string; you_are: string; ends_at_ms: number; card?: { index: number; term: string; forbidden: string[] } } | null;
  board?: { title: string; mermaid: string; slots: string[]; options: string[] };
  you?: { placements: Record<string, number>; wrong_finishes: number; finished: boolean };
  your_deadline_ms?: number;
  next_turn_starts_at_ms?: number;
  next_question_opens_at_ms?: number;
} };
export type MatchResults = { ranking: { id: string; name: string; rank: number | null; winner: boolean; correct?: number; total?: number; score?: number; total_ms?: number | null }[] };
export const gamesApi = {
  createRoom: (display_name: string, capacity: number) => http.post<Room>("rooms", { display_name, capacity }),
  join: (code: string, display_name: string) => http.post<Room>("rooms/join", { code: code.trim().toUpperCase(), display_name }),
  room: (id: string) => http.get<Room>(`rooms/${id}`),
  command: (room: Room, action: "ready" | "leave" | "close", ready = false) => http.post<Room>(`rooms/${room.id}/commands`, { expected_version: room.version, action, ready }),
  current: (room: string) => http.get<{ id: string; phase: string; game: Game }>(`rooms/${room}/match`),
  challenge: (body: { game: Game; topic: string; age: number; room_id?: string; count?: number; seconds?: number }) => http.post<{ id: string }>("challenges", body),
  createMatch: (challenge_id: string, mode: Mode, teams?: string[][]) => http.post<Match>("matches", { challenge_id, mode, ...(teams ? { teams } : {}) }),
  start: (id: string) => http.post<Match>(`matches/${id}/start`, {}),
  match: (id: string) => http.get<Match>(`matches/${id}`),
  answer: (id: string, question_index: number, choice: number) => http.post(`matches/${id}/answer`, { question_index, choice }),
  card: (id: string, card_index: number, action: "correct" | "skip" | "violation") => http.post(`matches/${id}/cards`, { card_index, action }),
  place: (id: string, placements: Record<string, number>) => http.put(`matches/${id}/placements`, { placements }),
  finish: (id: string) => http.post<{ perfect: boolean; correct?: number; wrong_slots?: string[] }>(`matches/${id}/finish`, {}),
  results: (id: string) => http.get<MatchResults>(`matches/${id}/results`),
  async diagram(id: string) { const r = await fetch(`/api/matches/${id}/diagram/view`, { cache: "no-store" }); if (!r.ok) throw new ApiError(r.status, "Couldn’t load the diagram."); return r.text(); },
};
