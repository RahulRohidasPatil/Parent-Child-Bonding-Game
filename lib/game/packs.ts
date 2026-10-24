export type WordPack = {
  id: string;
  name: string;
  emoji: string;
  /** Every word has an emoji so early readers can play along. */
  words: { word: string; emoji: string; clues: string[] }[];
  /** Vague clues an imposter bot can bluff with. */
  bluffs: string[];
};

export const PACKS: WordPack[] = [
  {
    id: "animals",
    name: "Animals",
    emoji: "🐾",
    bluffs: ["fluffy", "loud", "wild", "zoo", "cute", "fast"],
    words: [
      { word: "Penguin", emoji: "🐧", clues: ["ice", "waddle", "tuxedo", "slide"] },
      { word: "Elephant", emoji: "🐘", clues: ["trunk", "huge", "peanuts", "ears"] },
      { word: "Kangaroo", emoji: "🦘", clues: ["hop", "pouch", "Australia", "jump"] },
      { word: "Octopus", emoji: "🐙", clues: ["ink", "eight", "ocean", "wiggly"] },
      { word: "Owl", emoji: "🦉", clues: ["night", "hoot", "wise", "feathers"] },
    ],
  },
  {
    id: "food",
    name: "Food",
    emoji: "🍕",
    bluffs: ["yummy", "dinner", "kitchen", "sweet", "plate", "snack"],
    words: [
      { word: "Pizza", emoji: "🍕", clues: ["cheese", "slice", "oven", "toppings"] },
      { word: "Pancakes", emoji: "🥞", clues: ["syrup", "flip", "breakfast", "stack"] },
      { word: "Ice cream", emoji: "🍦", clues: ["cone", "cold", "scoop", "melt"] },
      { word: "Spaghetti", emoji: "🍝", clues: ["noodles", "twirl", "sauce", "fork"] },
      { word: "Popcorn", emoji: "🍿", clues: ["movie", "pop", "butter", "bucket"] },
    ],
  },
  {
    id: "places",
    name: "Places",
    emoji: "🏖️",
    bluffs: ["fun", "far", "visit", "people", "trip", "big"],
    words: [
      { word: "Beach", emoji: "🏖️", clues: ["sand", "waves", "towel", "sunscreen"] },
      { word: "Library", emoji: "📚", clues: ["quiet", "books", "borrow", "shelves"] },
      { word: "Space", emoji: "🚀", clues: ["stars", "astronaut", "float", "rocket"] },
      { word: "Farm", emoji: "🚜", clues: ["cows", "tractor", "barn", "eggs"] },
      { word: "Castle", emoji: "🏰", clues: ["king", "tower", "moat", "knight"] },
    ],
  },
  {
    id: "home",
    name: "At Home",
    emoji: "🏠",
    bluffs: ["room", "every day", "useful", "mine", "family", "inside"],
    words: [
      { word: "Bathtub", emoji: "🛁", clues: ["bubbles", "splash", "duck", "soap"] },
      { word: "Sofa", emoji: "🛋️", clues: ["comfy", "cushion", "nap", "TV"] },
      { word: "Toothbrush", emoji: "🪥", clues: ["minty", "teeth", "morning", "bristles"] },
      { word: "Fridge", emoji: "🧊", clues: ["cold", "magnets", "milk", "door"] },
      { word: "Blanket fort", emoji: "⛺", clues: ["pillows", "secret", "cozy", "build"] },
    ],
  },
  {
    id: "jobs",
    name: "Jobs",
    emoji: "👩‍🚒",
    bluffs: ["work", "uniform", "help", "busy", "tools", "important"],
    words: [
      { word: "Firefighter", emoji: "🚒", clues: ["hose", "ladder", "siren", "brave"] },
      { word: "Chef", emoji: "👨‍🍳", clues: ["hat", "recipe", "stir", "restaurant"] },
      { word: "Teacher", emoji: "🍎", clues: ["class", "homework", "chalk", "lesson"] },
      { word: "Pilot", emoji: "✈️", clues: ["sky", "airport", "wings", "captain"] },
      { word: "Vet", emoji: "🐶", clues: ["pets", "check-up", "bandage", "puppy"] },
    ],
  },
  {
    id: "fairytales",
    name: "Fairy Tales",
    emoji: "🧚",
    bluffs: ["magic", "story", "long ago", "bedtime", "spell", "brave"],
    words: [
      { word: "Dragon", emoji: "🐉", clues: ["fire", "wings", "cave", "treasure"] },
      { word: "Unicorn", emoji: "🦄", clues: ["horn", "rainbow", "sparkle", "horse"] },
      { word: "Wizard", emoji: "🧙", clues: ["wand", "beard", "potion", "hat"] },
      { word: "Mermaid", emoji: "🧜", clues: ["tail", "sea", "shells", "swim"] },
      { word: "Giant", emoji: "🪨", clues: ["tall", "beanstalk", "stomp", "huge"] },
    ],
  },
];

export const getPack = (id: string) => PACKS.find((p) => p.id === id) ?? PACKS[0];

/** A short talk-it-over prompt shown after every round — the bonding beat. */
export const BONDING_PROMPTS = [
  "Whose clue made you laugh the most this round?",
  "Grown-ups: what's the sneakiest thing you remember doing as a kid?",
  "Kids: which grown-up is the worst at keeping a straight face? 😄",
  "If you could spend a whole day as a {word}, what would you do?",
  "Plan it together: one fun thing you could do with a {word} this week.",
  "What's one thing you noticed about each other's clues?",
];

export const bondingPrompt = (round: number, word: string) =>
  BONDING_PROMPTS[(round - 1) % BONDING_PROMPTS.length].replace(
    "{word}",
    word.toLowerCase(),
  );
