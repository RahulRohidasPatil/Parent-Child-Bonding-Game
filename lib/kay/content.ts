/**
 * Curated, pre-reviewed learning content for the demo week.
 *
 * Per the plan (§7 Content Reliability): every explanation, flashcard, quiz
 * question and tutor answer points back to a lesson section (`sourceId`).
 * The backend should serve this same shape from Supabase.
 */

export type LessonSection = { id: string; heading: string; body: string };

export type Caption = { at: number; text: string };

export type Flashcard = { id: string; front: string; back: string; emoji: string; sourceId: string };

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  sourceId: string;
};

export type TutorAnswer = { match: string[]; question: string; answer: string; sourceId: string };

export type LearningBlock = {
  id: string;
  title: string;
  emoji: string;
  minutes: number;
  summary: string;
  scene: "sun" | "system" | "earth-moon" | "gravity";
  /** Text alternative for the animated explainer (screen readers, no-visual mode). */
  sceneDescription: string;
  captions: Caption[];
  sections: LessonSection[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  tutor: TutorAnswer[];
  /** Concepts a parent can ask Kay to help explain. */
  concepts: { id: string; name: string }[];
};

export const WEEK = {
  number: 43,
  subject: "Science",
  title: "The Solar System",
  emoji: "🪐",
  blurb: "Our Sun, its eight planets, their moons, and the invisible pull that holds it all together.",
  startsOn: "Mon 19 Oct",
  competitionAt: "Tomorrow · 5:30 pm",
  competitionIn: "1 day",
};

export const BLOCKS: LearningBlock[] = [
  {
    id: "sun",
    title: "Our Sun",
    emoji: "☀️",
    minutes: 5,
    summary: "The Sun is a star: a giant ball of hot, glowing gas.",
    scene: "sun",
    sceneDescription:
      "A pixel-art Sun glows in the centre of the screen. Small Earth sits far to the right. A beam of yellow light travels from the Sun to Earth, and a timer counts up to about 8 minutes.",
    captions: [
      { at: 0, text: "This is our Sun. It's a star, just like the ones you see at night." },
      { at: 4, text: "It's a giant ball of hot, glowing gas, much bigger than Earth." },
      { at: 8, text: "About 109 Earths could fit side by side across it." },
      { at: 12, text: "Its light travels to us in about 8 minutes." },
      { at: 16, text: "That light and heat are what make life on Earth possible." },
    ],
    sections: [
      {
        id: "sun-1",
        heading: "The Sun is a star",
        body: "The Sun is a star, like the stars you see at night. It looks much bigger and brighter because it's so much closer to us.",
      },
      {
        id: "sun-2",
        heading: "How big is it?",
        body: "The Sun is about 109 times wider than Earth. It's made mostly of hydrogen and helium gas.",
      },
      {
        id: "sun-3",
        heading: "Light on its way",
        body: "Sunlight takes about 8 minutes to travel from the Sun to Earth. The Sun's light and heat let plants grow and keep our planet warm.",
      },
    ],
    flashcards: [
      { id: "f1", emoji: "⭐", front: "What kind of object is the Sun?", back: "A star: a giant ball of hot, glowing gas.", sourceId: "sun-1" },
      { id: "f2", emoji: "📏", front: "About how many Earths fit across the Sun?", back: "About 109.", sourceId: "sun-2" },
      { id: "f3", emoji: "⏱️", front: "How long does sunlight take to reach Earth?", back: "About 8 minutes.", sourceId: "sun-3" },
      { id: "f4", emoji: "🎈", front: "What two gases is the Sun mostly made of?", back: "Hydrogen and helium.", sourceId: "sun-2" },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "The Sun is a…",
        options: ["Planet", "Star", "Moon", "Comet"],
        answer: 1,
        explanation: "The Sun is a star. It only looks bigger than other stars because it's much closer.",
        sourceId: "sun-1",
      },
      {
        id: "q2",
        prompt: "How long does sunlight take to reach Earth?",
        options: ["About 8 seconds", "About 8 minutes", "About 8 hours", "About 8 days"],
        answer: 1,
        explanation: "Light from the Sun takes about 8 minutes to reach us.",
        sourceId: "sun-3",
      },
      {
        id: "q3",
        prompt: "About how many Earths could fit across the Sun?",
        options: ["10", "50", "109", "1,000"],
        answer: 2,
        explanation: "The Sun is about 109 times wider than Earth.",
        sourceId: "sun-2",
      },
    ],
    tutor: [
      {
        match: ["why", "bright", "big", "close"],
        question: "Why does the Sun look bigger than other stars?",
        answer: "Because it's much, much closer to us than any other star. Other stars are so far away that they look like tiny dots.",
        sourceId: "sun-1",
      },
      {
        match: ["made", "gas", "hydrogen", "helium"],
        question: "What is the Sun made of?",
        answer: "Mostly two gases: hydrogen and helium.",
        sourceId: "sun-2",
      },
      {
        match: ["light", "minutes", "travel", "reach"],
        question: "How long does sunlight take to get here?",
        answer: "About 8 minutes. So the sunlight you see right now left the Sun about 8 minutes ago!",
        sourceId: "sun-3",
      },
    ],
    concepts: [
      { id: "star", name: "The Sun is a star" },
      { id: "light-time", name: "Light takes time to travel" },
    ],
  },
  {
    id: "planets",
    title: "The Eight Planets",
    emoji: "🪐",
    minutes: 6,
    summary: "Four rocky planets close in, four giant planets further out.",
    scene: "system",
    sceneDescription:
      "Pixel-art planets circle the Sun on their orbits. The four small rocky planets move quickly near the Sun; the four large giants move slowly further out. Jupiter, the biggest, is highlighted.",
    captions: [
      { at: 0, text: "Eight planets travel around the Sun." },
      { at: 4, text: "Mercury, Venus, Earth and Mars are small and rocky." },
      { at: 8, text: "Jupiter, Saturn, Uranus and Neptune are giants." },
      { at: 12, text: "Jupiter is the biggest planet of all." },
      { at: 16, text: "Planets closer to the Sun take less time to go around it." },
    ],
    sections: [
      {
        id: "planets-1",
        heading: "In order from the Sun",
        body: "Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune. Mercury is the closest to the Sun.",
      },
      {
        id: "planets-2",
        heading: "Rocky and giant",
        body: "The four inner planets are small and rocky. The four outer planets are giants. Jupiter is the biggest planet of all.",
      },
      {
        id: "planets-3",
        heading: "Hot Venus",
        body: "Venus is the hottest planet, even though Mercury is closer to the Sun. Venus's thick clouds trap the heat like a blanket.",
      },
    ],
    flashcards: [
      { id: "f1", emoji: "🥇", front: "Which planet is closest to the Sun?", back: "Mercury.", sourceId: "planets-1" },
      { id: "f2", emoji: "🦣", front: "Which is the biggest planet?", back: "Jupiter.", sourceId: "planets-2" },
      { id: "f3", emoji: "🔥", front: "Which is the hottest planet?", back: "Venus: its thick clouds trap heat.", sourceId: "planets-3" },
      { id: "f4", emoji: "🔢", front: "How many planets orbit our Sun?", back: "Eight.", sourceId: "planets-1" },
      { id: "f5", emoji: "🪨", front: "Name the four rocky planets.", back: "Mercury, Venus, Earth and Mars.", sourceId: "planets-2" },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Which planet is the biggest?",
        options: ["Saturn", "Earth", "Jupiter", "Neptune"],
        answer: 2,
        explanation: "Jupiter is the biggest planet in our Solar System.",
        sourceId: "planets-2",
      },
      {
        id: "q2",
        prompt: "Why is Venus hotter than Mercury?",
        options: [
          "It is closer to the Sun",
          "Its thick clouds trap heat",
          "It has volcanoes everywhere",
          "It spins faster",
        ],
        answer: 1,
        explanation: "Mercury is closer, but Venus's thick clouds trap heat like a blanket.",
        sourceId: "planets-3",
      },
      {
        id: "q3",
        prompt: "Which list shows only rocky planets?",
        options: ["Mars, Jupiter, Earth", "Mercury, Venus, Mars", "Saturn, Uranus, Venus", "Earth, Neptune, Mercury"],
        answer: 1,
        explanation: "The rocky planets are Mercury, Venus, Earth and Mars.",
        sourceId: "planets-2",
      },
      {
        id: "q4",
        prompt: "How many planets orbit the Sun?",
        options: ["7", "8", "9", "10"],
        answer: 1,
        explanation: "There are eight planets, from Mercury out to Neptune.",
        sourceId: "planets-1",
      },
    ],
    tutor: [
      {
        match: ["venus", "hot", "hottest"],
        question: "Why is Venus so hot?",
        answer: "Venus has very thick clouds that trap the Sun's heat, like a blanket. That makes it hotter than Mercury, even though Mercury is closer.",
        sourceId: "planets-3",
      },
      {
        match: ["biggest", "largest", "jupiter"],
        question: "Which planet is the biggest?",
        answer: "Jupiter! It's one of the four giant planets further from the Sun.",
        sourceId: "planets-2",
      },
      {
        match: ["order", "remember", "list"],
        question: "What order are the planets in?",
        answer: "From the Sun outwards: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.",
        sourceId: "planets-1",
      },
    ],
    concepts: [
      { id: "order", name: "The order of the planets" },
      { id: "greenhouse", name: "Why Venus is so hot" },
    ],
  },
  {
    id: "moons",
    title: "Moons & Phases",
    emoji: "🌙",
    minutes: 5,
    summary: "Our Moon circles Earth and borrows its light from the Sun.",
    scene: "earth-moon",
    sceneDescription:
      "Pixel-art Earth sits in the centre while the Moon circles it. Sunlight shines from the left, so one half of the Moon is always lit. As it moves, the lit part we can see from Earth grows and shrinks.",
    captions: [
      { at: 0, text: "The Moon travels around Earth." },
      { at: 4, text: "One trip takes about 27 days." },
      { at: 8, text: "The Moon doesn't make its own light. It reflects sunlight." },
      { at: 12, text: "As it moves, we see different amounts of its sunny side." },
      { at: 16, text: "Those changing shapes are called phases." },
    ],
    sections: [
      {
        id: "moons-1",
        heading: "Our Moon",
        body: "The Moon travels around Earth. One full trip takes about 27 days.",
      },
      {
        id: "moons-2",
        heading: "Borrowed light",
        body: "The Moon doesn't make its own light. It shines because it reflects light from the Sun.",
      },
      {
        id: "moons-3",
        heading: "Phases",
        body: "Half of the Moon is always lit by the Sun. As the Moon moves around Earth, we see different amounts of that lit half. These changing shapes are called phases.",
      },
    ],
    flashcards: [
      { id: "f1", emoji: "💡", front: "Does the Moon make its own light?", back: "No. It reflects sunlight.", sourceId: "moons-2" },
      { id: "f2", emoji: "📅", front: "About how long does the Moon take to go around Earth?", back: "About 27 days.", sourceId: "moons-1" },
      { id: "f3", emoji: "🌓", front: "What are the Moon's changing shapes called?", back: "Phases.", sourceId: "moons-3" },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "Why does the Moon shine?",
        options: ["It's on fire", "It reflects sunlight", "It has lights inside", "It's a star"],
        answer: 1,
        explanation: "The Moon reflects light from the Sun.",
        sourceId: "moons-2",
      },
      {
        id: "q2",
        prompt: "Why do we see Moon phases?",
        options: [
          "Earth's shadow covers it every night",
          "We see different amounts of its sunlit half",
          "The Moon changes shape",
          "Clouds block part of it",
        ],
        answer: 1,
        explanation: "Half the Moon is always lit; we see more or less of that half as it orbits Earth.",
        sourceId: "moons-3",
      },
    ],
    tutor: [
      {
        match: ["light", "shine", "glow"],
        question: "Why does the Moon glow?",
        answer: "It reflects sunlight, a bit like a mirror. It doesn't make any light of its own.",
        sourceId: "moons-2",
      },
      {
        match: ["phase", "shape", "half", "crescent"],
        question: "Why does the Moon change shape?",
        answer: "It doesn't really change shape! Half of it is always lit by the Sun, and as it moves around Earth we see different amounts of that lit half.",
        sourceId: "moons-3",
      },
    ],
    concepts: [{ id: "phases", name: "Why the Moon has phases" }],
  },
  {
    id: "gravity",
    title: "Gravity",
    emoji: "🍎",
    minutes: 5,
    summary: "The invisible pull that keeps planets in orbit.",
    scene: "gravity",
    sceneDescription:
      "A pixel-art apple falls from a tree to the ground. Then the view zooms out to show Earth circling the Sun, with an arrow showing the Sun's pull keeping Earth on its path.",
    captions: [
      { at: 0, text: "Gravity is a pull between things." },
      { at: 4, text: "It's why an apple falls down to the ground." },
      { at: 8, text: "Bigger, heavier things pull harder." },
      { at: 12, text: "The Sun's gravity keeps the planets moving around it." },
      { at: 16, text: "On the Moon, you'd weigh about one sixth as much." },
    ],
    sections: [
      {
        id: "gravity-1",
        heading: "A pull between things",
        body: "Gravity is a force that pulls things towards each other. It's why things fall down to the ground.",
      },
      {
        id: "gravity-2",
        heading: "Bigger pulls harder",
        body: "Objects with more mass have a stronger pull. The Sun is so massive that its gravity keeps all the planets moving around it.",
      },
      {
        id: "gravity-3",
        heading: "Weighing less on the Moon",
        body: "The Moon has less mass than Earth, so its pull is weaker. On the Moon, you would weigh about one sixth of what you weigh on Earth.",
      },
    ],
    flashcards: [
      { id: "f1", emoji: "🧲", front: "What is gravity?", back: "A force that pulls things towards each other.", sourceId: "gravity-1" },
      { id: "f2", emoji: "🔄", front: "What keeps the planets going around the Sun?", back: "The Sun's gravity.", sourceId: "gravity-2" },
      { id: "f3", emoji: "🌕", front: "On the Moon, you'd weigh about…", back: "One sixth of your Earth weight.", sourceId: "gravity-3" },
    ],
    quiz: [
      {
        id: "q1",
        prompt: "What keeps Earth moving around the Sun?",
        options: ["Wind", "The Sun's gravity", "Magnets", "The Moon"],
        answer: 1,
        explanation: "The Sun's strong gravity keeps the planets on their paths.",
        sourceId: "gravity-2",
      },
      {
        id: "q2",
        prompt: "On the Moon, you would weigh…",
        options: ["The same", "Twice as much", "About one sixth as much", "Nothing at all"],
        answer: 2,
        explanation: "The Moon's gravity is weaker, so you'd weigh about one sixth as much.",
        sourceId: "gravity-3",
      },
    ],
    tutor: [
      {
        match: ["fall", "down", "drop"],
        question: "Why do things fall down?",
        answer: "Gravity! Earth pulls things towards it, so when you drop something it falls to the ground.",
        sourceId: "gravity-1",
      },
      {
        match: ["moon", "weigh", "jump", "lighter"],
        question: "Why would I be lighter on the Moon?",
        answer: "The Moon has less mass than Earth, so its pull is weaker. You'd weigh about one sixth as much.",
        sourceId: "gravity-3",
      },
    ],
    concepts: [
      { id: "orbit", name: "How gravity keeps planets in orbit" },
      { id: "mass", name: "Why bigger things pull harder" },
    ],
  },
];

export const getBlock = (id: string) => BLOCKS.find((b) => b.id === id);

export const findSection = (sourceId: string) => {
  for (const b of BLOCKS) {
    const s = b.sections.find((x) => x.id === sourceId);
    if (s) return { block: b, section: s };
  }
  return null;
};

/**
 * Grounded tutor lookup. Returns `null` when the curated content doesn't
 * cover the question — the UI must say so rather than invent an answer.
 */
export function askTutor(block: LearningBlock, question: string): TutorAnswer | null {
  const words: string[] = question.toLowerCase().match(/[a-z]+/g) ?? [];
  let best: TutorAnswer | null = null;
  let bestScore = 0;
  for (const t of block.tutor) {
    const score = t.match.filter((m) => words.includes(m)).length;
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

/** Parent explain-it helper output, pre-written per concept and age band. */
export const EXPLANATIONS: Record<
  string,
  { analogy: string; sayThis: Record<"young" | "middle" | "older", string>; askThem: string; tryAtHome: string }
> = {
  star: {
    analogy: "A campfire looks huge when you sit next to it, but tiny from across a field.",
    sayThis: {
      young: "The Sun is a star, like the twinkly ones at night. It just looks big because it's our closest star.",
      middle: "The Sun is a star made of super-hot gas. Other stars are suns too, just much further away, so they look like dots.",
      older: "The Sun is an ordinary star. Its apparent size and brightness come from distance: it's roughly 270,000 times closer than the next nearest star.",
    },
    askThem: "If you flew to another star, what do you think our Sun would look like from there?",
    tryAtHome: "Hold a torch close, then walk it across the room. How does it change?",
  },
  "light-time": {
    analogy: "Like hearing thunder after you see lightning: things take time to travel.",
    sayThis: {
      young: "Sunlight goes super fast, but the Sun is so far away that it still takes about 8 minutes to reach us.",
      middle: "Light is the fastest thing there is, but the Sun is so far away that its light takes about 8 minutes to get here.",
      older: "Light travels about 300,000 km every second, and it still takes roughly 8 minutes 20 seconds to cover the 150 million km from the Sun.",
    },
    askThem: "So when we look at the Sun, are we seeing it now or a little while ago?",
    tryAtHome: "Set an 8-minute timer: that's how long ago the sunlight hitting the window left the Sun.",
  },
  order: {
    analogy: "Like runners on a racetrack: inside lanes are shorter, outside lanes are longer.",
    sayThis: {
      young: "There are eight planets. Let's say them in order: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune!",
      middle: "The four planets close to the Sun are small and rocky; the four far away are giants made mostly of gas and ice.",
      older: "The inner planets formed where it was too hot for ice, so they're rocky; further out, the giants gathered huge amounts of gas and ice.",
    },
    askThem: "Can you make up a silly sentence to remember the order? (My Very Eager Mother Just Served Us Noodles)",
    tryAtHome: "Line up 8 fruits from small to big and see where Jupiter would go.",
  },
  greenhouse: {
    analogy: "Like a car parked in the sun with the windows shut: heat gets in but can't get out.",
    sayThis: {
      young: "Venus has a big fluffy blanket of clouds that keeps all its heat in, so it's even hotter than Mercury.",
      middle: "Venus's thick clouds trap heat, so even though Mercury is closer to the Sun, Venus is the hottest planet.",
      older: "Venus's thick carbon-dioxide atmosphere traps heat (a runaway greenhouse effect), making it hotter than Mercury.",
    },
    askThem: "Why do you think a blanket keeps you warm at night?",
    tryAtHome: "Put two cups of warm water out, one covered with a lid. Which stays warm longer?",
  },
  phases: {
    analogy: "Like walking around a lamp holding a ball: you see different amounts of the lit side.",
    sayThis: {
      young: "Half the Moon is always sunny. As it moves around us, we see a little or a lot of the sunny half.",
      middle: "The Moon reflects sunlight. As it orbits Earth, we see different amounts of its lit half: those are the phases.",
      older: "Phases come from geometry: the Sun always lights half the Moon, and our viewing angle on that half changes through the month.",
    },
    askThem: "If half the Moon is always lit, why do we sometimes see none of it?",
    tryAtHome: "In a dark room, hold a ball at arm's length near a lamp and turn slowly in a circle.",
  },
  orbit: {
    analogy: "Like swinging a ball on a string: the string's pull keeps it going round and round.",
    sayThis: {
      young: "The Sun gives the planets an invisible hug that keeps them going round and round it.",
      middle: "The Sun's gravity pulls on the planets. They're moving fast sideways, so instead of falling in they keep circling.",
      older: "An orbit is a balance: the planet's sideways speed and the Sun's gravitational pull combine into a curved path.",
    },
    askThem: "What would happen to the ball if the string broke?",
    tryAtHome: "Swing a soft toy on a string (outside!) and let go: watch which way it flies.",
  },
  mass: {
    analogy: "Like a bowling ball on a trampoline: the heavier it is, the more things roll towards it.",
    sayThis: {
      young: "Big heavy things pull harder. The Sun is the biggest, so it pulls the hardest.",
      middle: "The more mass something has, the stronger its gravity. That's why the Sun can hold on to all the planets.",
      older: "Gravitational pull grows with mass and weakens with distance. The Sun holds over 99% of the Solar System's mass.",
    },
    askThem: "Why do you think you don't float away from Earth?",
    tryAtHome: "Drop a heavy book and a light ball together. Do they land at the same time?",
  },
};
