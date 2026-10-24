export const AVATAR_COLORS = ["sun", "coral", "mint", "sky", "grape", "pink"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];

export const ACCESSORIES = ["none", "crown", "cap", "party", "glasses", "astronaut", "headphones"] as const;
export type Accessory = (typeof ACCESSORIES)[number];

export type PlayerRole = "grownup" | "kid";

export type Profile = {
  name: string;
  color: AvatarColor;
  role: PlayerRole;
};

export type Player = Profile & {
  id: string;
  isHost: boolean;
  score: number;
  /** Mock-only: simulated players driven by the local mock room. */
  isBot?: boolean;
};

export type GameSettings = {
  packId: string;
  rounds: number;
  discussSeconds: number;
};

export type Phase =
  | "lobby"
  | "reveal"
  | "clues"
  | "discuss"
  | "vote"
  | "result"
  | "scoreboard";

export const PHASES: Phase[] = [
  "lobby",
  "reveal",
  "clues",
  "discuss",
  "vote",
  "result",
  "scoreboard",
];

export type Clue = { playerId: string; text: string };

/**
 * What *this* device is allowed to know about the secret.
 * A real server must only ever send the imposter `{ kind: "imposter" }` —
 * never the word.
 */
export type SecretCard =
  | { kind: "crew"; category: string; word: string; emoji: string }
  | { kind: "imposter"; category: string };

export type RoundOutcome = {
  accusedId: string | null; // null = tie, nobody accused
  imposterId: string;
  caught: boolean;
  tally: Record<string, number>;
  word: string;
  emoji: string;
};

export type RoomState = {
  code: string;
  meId: string;
  phase: Phase;
  players: Player[];
  settings: GameSettings;
  round: number;
  /** Server-side truth. Clients should only read `myCard` / `outcome`. */
  secret: { word: string; emoji: string; imposterId: string } | null;
  ready: string[];
  turnOrder: string[];
  clues: Clue[];
  discussEndsAt: number | null;
  votes: Record<string, string>;
  outcome: RoundOutcome | null;
};
