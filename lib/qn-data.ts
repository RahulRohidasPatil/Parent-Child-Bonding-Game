/** Static app content shared by the QuestNest screens. */

export type AvatarId = "nova" | "mia" | "zara" | "leo" | "sam" | "mom" | "dad";
export const AVATARS: { id: AvatarId; label: string; tint: string }[] = [
  { id: "nova", label: "Long wavy hair, green hoodie", tint: "#cdeff5" },
  { id: "mia", label: "Ponytail, red hoodie", tint: "#fde9f0" },
  { id: "zara", label: "Braids, denim jacket", tint: "#e6f0fc" },
  { id: "leo", label: "Twists, varsity jacket", tint: "#fff6dc" },
  { id: "sam", label: "Short hair, cosy jumper", tint: "#e2f3eb" },
  { id: "mom", label: "Wavy bob, blue cardigan", tint: "#fde9f0" },
  { id: "dad", label: "Curly hair, rust jacket", tint: "#e6f0fc" },
];

export type PetId = "cat";
export const PETS: { id: PetId; name: string; price: number }[] = [{ id: "cat", name: "Mochi the cat", price: 0 }];

export type Subject = "science" | "maths" | "english" | "history" | "geography";
export const SUBJECTS: { id: Subject; label: string; room: string; tile: string; ink: string }[] = [
  { id: "science", label: "Science", room: "Science lab", tile: "#e2f3eb", ink: "#226e52" },
  { id: "maths", label: "Maths", room: "Maths workshop", tile: "#fff6dc", ink: "#8a5b00" },
  { id: "english", label: "English", room: "Reading nook", tile: "#fde9f0", ink: "#a83a60" },
  { id: "history", label: "History", room: "History museum", tile: "#fff0e3", ink: "#9a3d0a" },
  { id: "geography", label: "Geography", room: "Explorer’s den", tile: "#e6f0fc", ink: "#245ea8" },
];
export const subjectOf = (id: string) => SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];

/** Six levelling items per room (cosmetic only: never affects scores). */
export const ROOM_ITEMS: Record<Subject, string[]> = {
  science: ["Robot desk", "Microscope", "Plant shelf", "Solar model", "Chem bench", "Star lamp"],
  maths: ["Chalkboard", "Abacus", "Shape rug", "Clock", "Bookcase", "Desk"],
  english: ["Reading sofa", "Bookcase", "Typewriter", "Poster wall", "Rug", "Lamp"],
  history: ["Knight hall", "Castle model", "Steam train", "Timeline wall", "Display case", "Ship"],
  geography: ["Globe", "Map table", "Rock collection", "Weather station", "Palm corner", "Compass"],
};

export type PartyGame = { id: string; name: string; glyph: string; tile: string; ink: string; min: number; players: string; how: string };
export const PARTY_GAMES: PartyGame[] = [
  { id: "forbidden", name: "Forbidden clues", glyph: "!?", tile: "#fff0e3", ink: "#c25a12", min: 4, players: "4–8", how: "Explain the term without saying the banned words. Your team guesses." },
  { id: "forehead", name: "Forehead guess", glyph: "?", tile: "#e6f0fc", ink: "#245ea8", min: 2, players: "2–8", how: "Hold the phone to your forehead. Friends give clues until you guess the term." },
  { id: "relay", name: "Knowledge relay", glyph: "→", tile: "#e2f3eb", ink: "#226e52", min: 2, players: "2–8", how: "Name a valid example, then pass the phone. No repeats." },
  { id: "factcheck", name: "Fact check", glyph: "✓", tile: "#eeeafd", ink: "#5a43b8", min: 1, players: "1–8", how: "Vote fake or fact, explain why, then see the answer." },
  { id: "race", name: "MCQ quiz", glyph: "?", tile: "#fde9f0", ink: "#a83a60", min: 2, players: "2–6", how: "Answer multiple choice and true or false questions. Most right wins." },
  { id: "sketch", name: "Sketch it", glyph: "✎", tile: "#fff6dc", ink: "#8a5b00", min: 3, players: "3–8", how: "Draw the term while your team guesses." },
];

export type Person = { name: string; avatar: AvatarId; status: string; base: string; online: "on" | "away" | "off" };
export const FRIENDS: Person[] = [
  { name: "Zara", avatar: "zara", status: "Playing Fact check", base: "History museum · Tier 2", online: "on" },
  { name: "Mia", avatar: "mia", status: "Studying fractions", base: "Maths workshop · Tier 1", online: "away" },
  { name: "Leo", avatar: "leo", status: "Just scanned English notes", base: "Reading nook · Tier 1", online: "on" },
  { name: "Sam", avatar: "sam", status: "Seen 2 hours ago", base: "Explorer’s den · Tier 1", online: "off" },
];
export const FAMILY: Person[] = [
  { name: "Mom", avatar: "mom", status: "Checking your notes", base: "Parent", online: "on" },
  { name: "Dad", avatar: "dad", status: "Wants a duel after dinner", base: "Parent", online: "away" },
  { name: "Sam", avatar: "sam", status: "Little brother", base: "Explorer’s den · Tier 1", online: "off" },
];

export type Quest = { id: string; title: string; of: number; reward: number; kind: "daily" | "weekly" };
export const QUESTS: Quest[] = [
  { id: "d-lesson", title: "Finish 1 lesson", of: 1, reward: 60, kind: "daily" },
  { id: "d-quiz", title: "Answer 5 quiz questions", of: 5, reward: 50, kind: "daily" },
  { id: "d-cards", title: "Review 8 flashcards", of: 8, reward: 40, kind: "daily" },
  { id: "d-duel", title: "Play 1 family duel", of: 1, reward: 40, kind: "daily" },
  { id: "w-duels", title: "Play 3 family duels", of: 3, reward: 250, kind: "weekly" },
  { id: "w-lessons", title: "Finish 5 lessons", of: 5, reward: 200, kind: "weekly" },
  { id: "w-weak", title: "Practise your weak spots twice", of: 2, reward: 150, kind: "weekly" },
  { id: "w-upload", title: "Learn from 3 uploads", of: 3, reward: 120, kind: "weekly" },
];

export const UPGRADE_COST = (nextLevel: number) => 20 * nextLevel;
export const TIER_UP_COST = 2000;
