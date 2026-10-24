"use client";

/**
 * A fully local stand-in for the multiplayer backend.
 *
 * The UI only talks to `useMockRoom()`'s return value ({ state, actions, ... }).
 * To go live, replace this hook with one that subscribes to the server's room
 * state and sends the same actions over the wire — the screens don't change.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getPack } from "./packs";
import { roundPoints } from "./rules";
import type {
  AvatarColor,
  GameSettings,
  Phase,
  Player,
  Profile,
  RoomState,
  RoundOutcome,
  SecretCard,
} from "./types";

export const DEFAULT_SETTINGS: GameSettings = {
  packId: "animals",
  rounds: 3,
  discussSeconds: 60,
};

export const MIN_PLAYERS = 3;
const TARGET_PLAYERS = 4;

const BOT_POOL: (Profile & { color: AvatarColor })[] = [
  { name: "Mom", color: "coral", role: "grownup" },
  { name: "Leo", color: "mint", role: "kid" },
  { name: "Grandpa Joe", color: "sky", role: "grownup" },
  { name: "Mia", color: "pink", role: "kid" },
  { name: "Auntie Sam", color: "grape", role: "grownup" },
];

// ---------------------------------------------------------------------------
// Pure game rules
// ---------------------------------------------------------------------------

type Deal = { word: string; emoji: string; imposterId: string; turnOrder: string[] };

type Action =
  | { type: "join"; player: Player }
  | { type: "deal"; deal: Deal; fresh: boolean }
  | { type: "ready"; playerId: string }
  | { type: "clue"; playerId: string; text: string; now: number }
  | { type: "discuss-ready"; playerId: string }
  | { type: "start-vote" }
  | { type: "vote"; voterId: string; targetId: string }
  | { type: "show-scores" }
  | { type: "play-again" }
  | { type: "replace"; state: RoomState };

const allIn = (ids: string[], players: Player[]) =>
  players.every((p) => ids.includes(p.id));

function scoreRound(state: RoomState): RoomState {
  const secret = state.secret!;
  const tally: Record<string, number> = {};
  for (const target of Object.values(state.votes)) tally[target] = (tally[target] ?? 0) + 1;
  const top = Math.max(0, ...Object.values(tally));
  const leaders = Object.keys(tally).filter((id) => tally[id] === top);
  const accusedId = leaders.length === 1 ? leaders[0] : null;
  const caught = accusedId === secret.imposterId;

  const outcome: RoundOutcome = {
    accusedId,
    imposterId: secret.imposterId,
    caught,
    tally,
    word: secret.word,
    emoji: secret.emoji,
  };
  const players = state.players.map((p) => {
    return { ...p, score: p.score + roundPoints(caught, p.id === secret.imposterId) };
  });
  return { ...state, phase: "result", outcome, players };
}

function reducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case "join":
      if (state.phase !== "lobby" || state.players.some((p) => p.id === action.player.id))
        return state;
      return { ...state, players: [...state.players, action.player] };

    case "deal":
      return {
        ...state,
        phase: "reveal",
        round: action.fresh ? 1 : state.round + 1,
        players: action.fresh ? state.players.map((p) => ({ ...p, score: 0 })) : state.players,
        secret: {
          word: action.deal.word,
          emoji: action.deal.emoji,
          imposterId: action.deal.imposterId,
        },
        turnOrder: action.deal.turnOrder,
        ready: [],
        clues: [],
        votes: {},
        outcome: null,
        discussEndsAt: null,
      };

    case "ready": {
      if (state.phase !== "reveal" || state.ready.includes(action.playerId)) return state;
      const ready = [...state.ready, action.playerId];
      return allIn(ready, state.players)
        ? { ...state, ready: [], phase: "clues" }
        : { ...state, ready };
    }

    case "clue": {
      if (state.phase !== "clues") return state;
      if (state.turnOrder[state.clues.length] !== action.playerId) return state;
      const clues = [...state.clues, { playerId: action.playerId, text: action.text.trim() }];
      if (clues.length < state.turnOrder.length) return { ...state, clues };
      return {
        ...state,
        clues,
        phase: "discuss",
        ready: [],
        discussEndsAt: action.now + state.settings.discussSeconds * 1000,
      };
    }

    case "discuss-ready": {
      if (state.phase !== "discuss" || state.ready.includes(action.playerId)) return state;
      const ready = [...state.ready, action.playerId];
      return allIn(ready, state.players)
        ? { ...state, ready: [], phase: "vote" }
        : { ...state, ready };
    }

    case "start-vote":
      return state.phase === "discuss" ? { ...state, ready: [], phase: "vote" } : state;

    case "vote": {
      if (state.phase !== "vote" || state.votes[action.voterId]) return state;
      if (action.voterId === action.targetId) return state;
      const next = { ...state, votes: { ...state.votes, [action.voterId]: action.targetId } };
      return allIn(Object.keys(next.votes), state.players) ? scoreRound(next) : next;
    }

    case "show-scores":
      return { ...state, phase: "scoreboard" };

    case "play-again":
      return {
        ...state,
        phase: "lobby",
        round: 0,
        secret: null,
        ready: [],
        clues: [],
        votes: {},
        outcome: null,
        discussEndsAt: null,
        players: state.players.map((p) => ({ ...p, score: 0 })),
      };

    case "replace":
      return action.state;
  }
}

// ---------------------------------------------------------------------------
// Selectors — safe, per-device views of the room
// ---------------------------------------------------------------------------

export function selectMyCard(state: RoomState): SecretCard | null {
  if (!state.secret) return null;
  const category = getPack(state.settings.packId).name;
  return state.secret.imposterId === state.meId
    ? { kind: "imposter", category }
    : { kind: "crew", category, word: state.secret.word, emoji: state.secret.emoji };
}

export const selectCurrentTurnId = (state: RoomState) =>
  state.phase === "clues" ? (state.turnOrder[state.clues.length] ?? null) : null;

export const selectIsLastRound = (state: RoomState) => state.round >= state.settings.rounds;

// ---------------------------------------------------------------------------
// Mock-only helpers: dealing, bots, dev fast-forward
// ---------------------------------------------------------------------------

export type ImposterMode = "random" | "me" | "not-me";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeDeal(state: RoomState, mode: ImposterMode): Deal {
  const pack = getPack(state.settings.packId);
  const used = state.secret?.word;
  const options = pack.words.filter((w) => w.word !== used);
  const pick = options[Math.floor(Math.random() * options.length)];
  const ids = state.players.map((p) => p.id);
  const pool =
    mode === "me" ? [state.meId] : mode === "not-me" ? ids.filter((id) => id !== state.meId) : ids;
  const imposterId = pool[Math.floor(Math.random() * pool.length)];
  return { word: pick.word, emoji: pick.emoji, imposterId, turnOrder: shuffle(ids) };
}

function botClue(state: RoomState, playerId: string) {
  const pack = getPack(state.settings.packId);
  const index = state.clues.length;
  if (state.secret?.imposterId === playerId) return pack.bluffs[index % pack.bluffs.length];
  const entry = pack.words.find((w) => w.word === state.secret?.word);
  return entry ? entry.clues[index % entry.clues.length] : "hmm";
}

function botVote(state: RoomState, voterId: string) {
  const others = state.players.filter((p) => p.id !== voterId).map((p) => p.id);
  const imposterId = state.secret!.imposterId;
  // Crew bots are decent detectives; the imposter bot points at someone else.
  if (voterId !== imposterId && Math.random() < 0.6) return imposterId;
  return others[Math.floor(Math.random() * others.length)];
}

function botsFor(profile: Profile) {
  return BOT_POOL.filter((b) => b.color !== profile.color);
}

/** Jump straight to any phase with plausible data — for design review. */
function fastForward(state: RoomState, target: Phase, mode: ImposterMode): RoomState {
  let s = state;
  const pool = botsFor(meProfile(s));
  let n = 0;
  while (s.players.length < TARGET_PLAYERS && n < pool.length) {
    s = reducer({ ...s, phase: "lobby" }, { type: "join", player: botPlayer(pool[n], n) });
    n++;
  }
  if (target === "lobby") return reducer(s, { type: "play-again" });

  s = reducer(s, { type: "deal", deal: makeDeal(s, mode), fresh: s.round === 0 });
  if (target === "reveal") return s;

  for (const p of s.players) s = reducer(s, { type: "ready", playerId: p.id });
  if (target === "clues") return s;

  for (const id of s.turnOrder)
    s = reducer(s, { type: "clue", playerId: id, text: botClue(s, id), now: Date.now() });
  if (target === "discuss") return s;

  s = reducer(s, { type: "start-vote" });
  if (target === "vote") return s;

  for (const p of s.players) s = reducer(s, { type: "vote", voterId: p.id, targetId: botVote(s, p.id) });
  if (target === "result") return s;

  return reducer(s, { type: "show-scores" });
}

const meProfile = (s: RoomState): Profile => s.players.find((p) => p.id === s.meId)!;

const botPlayer = (bot: Profile, i: number, isHost = false): Player => ({
  ...bot,
  id: `bot-${i}`,
  isHost,
  isBot: true,
  score: 0,
});

type BotStep = { delay: number; act: () => Action };

function nextBotStep(state: RoomState, profile: Profile, mode: ImposterMode): BotStep | null {
  const bots = state.players.filter((p) => p.isBot);
  const host = state.players.find((p) => p.isHost);
  switch (state.phase) {
    case "lobby": {
      const pool = botsFor(profile);
      const joined = new Set(state.players.map((p) => p.name));
      const nextBot = pool.findIndex((b) => !joined.has(b.name));
      if (state.players.length < TARGET_PLAYERS && nextBot >= 0)
        return {
          delay: 1400,
          act: () => ({ type: "join", player: botPlayer(pool[nextBot], nextBot) }),
        };
      if (host?.isBot && state.players.length >= MIN_PLAYERS)
        return {
          delay: 3000,
          act: () => ({ type: "deal", deal: makeDeal(state, mode), fresh: true }),
        };
      return null;
    }
    case "reveal": {
      const bot = bots.find((b) => !state.ready.includes(b.id));
      return bot ? { delay: 1100, act: () => ({ type: "ready", playerId: bot.id }) } : null;
    }
    case "clues": {
      const turn = state.players.find((p) => p.id === selectCurrentTurnId(state));
      if (!turn?.isBot) return null;
      return {
        delay: 2000,
        act: () => ({ type: "clue", playerId: turn.id, text: botClue(state, turn.id), now: Date.now() }),
      };
    }
    case "discuss": {
      const bot = bots.find((b) => !state.ready.includes(b.id));
      return bot
        ? { delay: 2500, act: () => ({ type: "discuss-ready", playerId: bot.id }) }
        : null;
    }
    case "vote": {
      const bot = bots.find((b) => !state.votes[b.id]);
      return bot
        ? { delay: 1200, act: () => ({ type: "vote", voterId: bot.id, targetId: botVote(state, bot.id) }) }
        : null;
    }
    case "result":
      if (!host?.isBot) return null;
      return {
        delay: 9000,
        act: () =>
          selectIsLastRound(state)
            ? { type: "show-scores" }
            : { type: "deal", deal: makeDeal(state, mode), fresh: false },
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

type Options = {
  code: string;
  profile: Profile;
  /** Settings when this device created the room; `null` when joining. */
  hostSettings: GameSettings | null;
};

function initialState({ code, profile, hostSettings }: Options): RoomState {
  const me: Player = { ...profile, id: "me", isHost: !!hostSettings, score: 0 };
  const players = hostSettings ? [me] : [botPlayer(botsFor(profile)[0], 0, true), me];
  return {
    code,
    meId: me.id,
    phase: "lobby",
    players,
    settings: hostSettings ?? DEFAULT_SETTINGS,
    round: 0,
    secret: null,
    ready: [],
    turnOrder: [],
    clues: [],
    discussEndsAt: null,
    votes: {},
    outcome: null,
  };
}

export function useMockRoom(options: Options) {
  const [state, dispatch] = useReducer(reducer, options, initialState);
  const [imposterMode, setImposterMode] = useState<ImposterMode>("random");
  const modeRef = useRef(imposterMode);
  useEffect(() => {
    modeRef.current = imposterMode;
  }, [imposterMode]);

  const { profile } = options;

  // Drive the simulated players.
  useEffect(() => {
    const step = nextBotStep(state, profile, modeRef.current);
    if (!step) return;
    const t = setTimeout(() => dispatch(step.act()), step.delay);
    return () => clearTimeout(t);
  }, [state, profile]);

  // Discussion timer runs out → voting starts.
  useEffect(() => {
    if (state.phase !== "discuss" || !state.discussEndsAt) return;
    const t = setTimeout(
      () => dispatch({ type: "start-vote" }),
      Math.max(0, state.discussEndsAt - Date.now()),
    );
    return () => clearTimeout(t);
  }, [state.phase, state.discussEndsAt]);

  const me = state.players.find((p) => p.id === state.meId)!;
  const host = state.players.find((p) => p.isHost)!;
  const myCard = useMemo(() => selectMyCard(state), [state]);

  const deal = useCallback(
    (fresh: boolean) => dispatch({ type: "deal", deal: makeDeal(state, modeRef.current), fresh }),
    [state],
  );

  const actions = {
    start: () => deal(true),
    ready: () => dispatch({ type: "ready", playerId: state.meId }),
    clue: (text: string) =>
      dispatch({ type: "clue", playerId: state.meId, text, now: Date.now() }),
    discussReady: () => dispatch({ type: "discuss-ready", playerId: state.meId }),
    skipToVote: () => dispatch({ type: "start-vote" }),
    vote: (targetId: string) => dispatch({ type: "vote", voterId: state.meId, targetId }),
    nextRound: () => deal(false),
    showScores: () => dispatch({ type: "show-scores" }),
    playAgain: () => dispatch({ type: "play-again" }),
  };

  const dev = {
    imposterMode,
    setImposterMode,
    jump: (phase: Phase) =>
      dispatch({ type: "replace", state: fastForward(state, phase, modeRef.current) }),
  };

  return {
    state,
    me,
    host,
    isHost: me.isHost,
    myCard,
    currentTurnId: selectCurrentTurnId(state),
    isLastRound: selectIsLastRound(state),
    actions,
    dev,
  };
}

export type Room = ReturnType<typeof useMockRoom>;
