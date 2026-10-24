/**
 * Mock app data for the UI. Shapes are intended to map 1:1 onto Supabase
 * tables/views (profiles, teams, badges, quests, inventory, progress…).
 */
import type { Accessory, AvatarColor } from "@/lib/game/types";

export type { Accessory };

export const APP_NAME = "Kay";

export type Role = "parent" | "kid" | "solo";

export type Person = {
  name: string;
  role: Role;
  color: AvatarColor;
  accessory: Accessory;
};

export type Team = {
  name: string;
  members: [Person, Person];
  points: number;
};

export const DEMO_ME: Person = { name: "Aarav", role: "kid", color: "sky", accessory: "astronaut" };
export const DEMO_PARTNER: Person = { name: "Priya", role: "parent", color: "coral", accessory: "glasses" };
export const DEMO_TEAM_NAME = "Comet Crew";

export const OPPONENTS: Team[] = [
  {
    name: "Rocket Rangers",
    points: 340,
    members: [
      { name: "Sam", role: "parent", color: "mint", accessory: "cap" },
      { name: "Leo", role: "kid", color: "sun", accessory: "party" },
    ],
  },
  {
    name: "Star Seekers",
    points: 295,
    members: [
      { name: "Grandpa Joe", role: "parent", color: "grape", accessory: "none" },
      { name: "Mia", role: "kid", color: "pink", accessory: "crown" },
    ],
  },
  {
    name: "Orbit Owls",
    points: 260,
    members: [
      { name: "Dana", role: "parent", color: "sun", accessory: "headphones" },
      { name: "Zoe", role: "kid", color: "mint", accessory: "none" },
    ],
  },
];

export const TODAY = {
  dayOfWeek: 4, // Thu of the learning week (Mon–Fri); competition is Friday
  minutesDone: 9,
  minutesGoal: 15,
  streakDays: 4,
  points: 420,
  /** Daily activity allowance (plan §3). Lessons & accessibility never cost allowance. */
  allowance: { base: 4, bonus: 1, used: 2, bonusFrom: "Flashcard Fan" },
};

export const PARTNER_ACTIVITY = [
  { who: "partner", text: "finished Flashcards · Our Sun", when: "20 min ago" },
  { who: "me", text: "scored 3/4 on Quiz · The Eight Planets", when: "Yesterday" },
  { who: "partner", text: "earned the Night Owl badge", when: "Yesterday" },
] as const;

export type BlockProgress = { lesson: boolean; flashcards: number; quiz: number | null };

/** Per-block progress for me and my partner (quiz = best % or null). */
export const PROGRESS: Record<string, { me: BlockProgress; partner: BlockProgress }> = {
  sun: { me: { lesson: true, flashcards: 100, quiz: 100 }, partner: { lesson: true, flashcards: 100, quiz: 67 } },
  planets: { me: { lesson: true, flashcards: 60, quiz: 75 }, partner: { lesson: true, flashcards: 40, quiz: null } },
  moons: { me: { lesson: false, flashcards: 0, quiz: null }, partner: { lesson: true, flashcards: 100, quiz: 50 } },
  gravity: { me: { lesson: false, flashcards: 0, quiz: null }, partner: { lesson: false, flashcards: 0, quiz: null } },
};

/** Concept mastery from answers (plan §6 learning feedback). */
export const MASTERY: { concept: string; blockId: string; me: number; partner: number }[] = [
  { concept: "The Sun is a star", blockId: "sun", me: 95, partner: 90 },
  { concept: "Sunlight travel time", blockId: "sun", me: 85, partner: 60 },
  { concept: "Order of the planets", blockId: "planets", me: 80, partner: 55 },
  { concept: "Why Venus is hottest", blockId: "planets", me: 40, partner: 75 },
  { concept: "Moon phases", blockId: "moons", me: 20, partner: 70 },
  { concept: "Gravity & orbits", blockId: "gravity", me: 0, partner: 10 },
];

export const WEEK_MINUTES = [
  { day: "Mon", me: 16, partner: 12 },
  { day: "Tue", me: 15, partner: 18 },
  { day: "Wed", me: 12, partner: 15 },
  { day: "Thu", me: 9, partner: 6 },
];

export type Badge = {
  id: string;
  name: string;
  emoji: string;
  how: string;
  unlock?: string;
  earned: boolean;
  progress?: [number, number];
};

export const BADGES: Badge[] = [
  { id: "fan", name: "Flashcard Fan", emoji: "🃏", how: "Finish 3 flashcard decks", unlock: "+1 activity a day for 7 days", earned: true },
  { id: "streak", name: "On a Roll", emoji: "🔥", how: "Learn 3 days in a row", earned: true },
  { id: "team", name: "Team Spirit", emoji: "🤝", how: "Both teammates finish the same block", unlock: "+1 bonus quiz attempt", earned: true },
  { id: "quiz", name: "Quiz Whiz", emoji: "🧠", how: "Score 100% on 3 quizzes", unlock: "+2 activities a day for 3 days", earned: false, progress: [1, 3] },
  { id: "owl", name: "Night Owl", emoji: "🦉", how: "Learn after 7 pm", earned: false, progress: [0, 1] },
  { id: "champ", name: "Week Champion", emoji: "🏆", how: "Win the weekly competition", unlock: "A rare reward box", earned: false, progress: [0, 1] },
];

export type Quest = {
  id: string;
  title: string;
  kind: "daily" | "weekly";
  progress: [number, number];
  reward: string;
  endsIn: string;
};

export const QUESTS: Quest[] = [
  { id: "d1", kind: "daily", title: "Learn for 15 minutes", progress: [9, 15], reward: "20 pts", endsIn: "7h 12m" },
  { id: "d2", kind: "daily", title: "Answer 5 quiz questions", progress: [5, 5], reward: "Reward box", endsIn: "7h 12m" },
  { id: "w1", kind: "weekly", title: "Finish all 4 blocks with your partner", progress: [1, 4], reward: "Rare box", endsIn: "2d 7h" },
  { id: "w2", kind: "weekly", title: "Play 2 practice matches", progress: [1, 2], reward: "50 pts", endsIn: "2d 7h" },
];

export type Item = { id: Accessory; name: string; cost: number; owned: boolean; rarity: "common" | "rare" | "epic" };

export const ITEMS: Item[] = [
  { id: "none", name: "No hat", cost: 0, owned: true, rarity: "common" },
  { id: "cap", name: "Explorer cap", cost: 0, owned: true, rarity: "common" },
  { id: "astronaut", name: "Space helmet", cost: 150, owned: true, rarity: "rare" },
  { id: "glasses", name: "Smart specs", cost: 80, owned: false, rarity: "common" },
  { id: "headphones", name: "Podcast phones", cost: 120, owned: false, rarity: "rare" },
  { id: "party", name: "Party hat", cost: 60, owned: false, rarity: "common" },
  { id: "crown", name: "Champion crown", cost: 400, owned: false, rarity: "epic" },
];

/** Possible reward-box drops (odds TBD by the team — illustrative only). */
export const BOX_DROPS: { label: string; emoji: string; rarity: Item["rarity"] }[] = [
  { label: "+30 points", emoji: "🪙", rarity: "common" },
  { label: "Party hat", emoji: "🥳", rarity: "common" },
  { label: "+1 activity today", emoji: "⚡", rarity: "rare" },
  { label: "Podcast phones", emoji: "🎧", rarity: "rare" },
  { label: "Champion crown", emoji: "👑", rarity: "epic" },
];

export const PAST_RESULTS = [
  { week: "Week 42 · Volcanoes 🌋", place: 2, of: 6, points: 85 },
  { week: "Week 41 · Fractions 🍕", place: 1, of: 5, points: 120 },
];
