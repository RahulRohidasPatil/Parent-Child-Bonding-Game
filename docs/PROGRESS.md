# Progress Tracker

**Last updated:** 24 Oct 2026
**Purpose:** frontend progress only: what is built, where it lives, and what is still open. Backend progress is tracked in the backend repository; product direction lives in [PRODUCT_PLAN.md](PRODUCT_PLAN.md).

## Summary

| Area | Status | Where |
| --- | --- | --- |
| Project setup (Next.js 16, React 19, Tailwind 4, shadcn) | ✅ Done | `main` |
| **UI screens: learning app + party game** | ✅ Built on mock data, **not connected to the backend API yet** | `user_interface_v1` |
| Login / registration screens | ⬜ Not started | n/a |
| Upload → review → study-plan screens (plan §0) | ⬜ Not started | n/a |
| Pass-the-phone party games (plan §10 recommendation) | ⬜ Not started | n/a |

## UI screens (`user_interface_v1`)

All screens are mobile-first, run without any backend, and use mock data. Run with `npm install` then `npm run dev`, and open http://localhost:3000.

### Learning app

| Route | Screen | What it does |
| --- | --- | --- |
| `/` | Welcome | App intro: weekly topic, about 15 min a day, team up |
| `/onboarding` | Sign-up flow | Parent / kid / solo → name and avatar colour → create team (shows code) or join with a 4-letter code → daily goal and accessibility quick settings |
| `/home` | Today | Weekly topic card, minutes vs daily goal, activities left today (badge bonus shown), team progress, partner activity, competition countdown, daily quests; parents also see the "Explain it" card |
| `/learn` | Learning blocks | 4 blocks, each with Lesson / Flashcards / Quiz status for you and your partner, plus the activity allowance |
| `/learn/[block]` | Lesson | Pixel-art animated explainer (captions, transcript, voiceover, text description), lesson text with read-aloud, and an **"Ask Kay" tutor that only answers from the lesson and cites the section, or says it can't answer** |
| `/learn/[block]/flashcards` | Flashcards | Flip cards, got-it / still-learning, retry tricky cards, keyboard shortcuts |
| `/learn/[block]/quiz` | Quiz | Multiple choice, explanation plus a link to the source section after each answer, score summary and points |
| `/me/progress` | Progress | Minutes per day (you vs partner, with a table view), understanding per concept, "practise next", "learn from each other" |
| `/explain` | Explain it (parents) | Pick a concept and an age band → what to say, an analogy, a question to ask, an at-home activity |
| `/compete` | Compete hub | Weekly showdown (draft format), ways to play, class team ranking, past results |
| `/compete/match` | Practice match | Playable 2v2: lobby → team quiz (partner's pick visible, "talk it over" prompt) → practical challenge with an equal-points alternative → results and reward box |
| `/rewards` | Rewards | Points, openable reward box (illustrative drops), daily and weekly quests with claim, badges and what they unlock |
| `/rewards/avatar` | Avatar studio | Colour and gear; buy with points, preview, equip |
| `/me` | Profile | Team info, links, **demo switch to view the app as Kid / Parent / Solo** |
| `/me/settings` | Settings | Text size, light/dark theme, higher contrast, reduce motion, captions, voiceover (all free, never cost activities) |

### Party game: "Splash" (imposter word game)

| Route | Screen |
| --- | --- |
| `/splash` | Home and how-to-play |
| `/splash/host`, `/splash/join` | Create a room (word pack, rounds, chat timer) / join by room code |
| `/splash/room/[code]` | Lobby → secret word (press and hold to peek) → one-word clues → discussion timer → vote → staged reveal with a family "talk about it" prompt → scoreboard |

Splash runs entirely locally with simulated players. A dev-only wrench button jumps to any phase.

### Design system

- **Look:** warm light theme by default, plus a dark theme; Splash uses its own night palette.
- **Type:** Fredoka (headings) and Nunito (body).
- **Tokens:** all colours are in `app/globals.css`. Brand colours: sun, coral, mint, sky, grape, pink.
- **Components:** shadcn Button / Input / Dialog, restyled, including chunky "game" buttons. Avatars are SVG blob characters with accessories, drawn in code.
- **Accessibility built in:** labelled controls, keyboard support, captions and transcripts, text descriptions of animations, adjustable text size, contrast and reduced-motion modes. **Not yet tested with screen-reader users.**

### Checks run

TypeScript, ESLint and the production build pass. Every screen was clicked through in a browser at phone and desktop sizes with no console errors. Real phones and assistive technology have not been tested.

## Handover: where the mock data lives

When the screens are connected to the backend API, these files are what get replaced; screen code should not need to change.

| File | Contains | Future source |
| --- | --- | --- |
| `lib/kay/content.ts` | Week topic, learning blocks, lesson sections, captions, flashcards, quiz, tutor answers, parent explanations, each linked to a source section | Reviewed learning blocks from the API (plan §7) |
| `lib/kay/data.ts` | Demo users and team, opponents, today's stats, progress, mastery, badges, quests, items, box drops | Backend API |
| `lib/kay/store.ts` | Signed-in person and accessibility preferences (browser `localStorage`) | Signed-in user's profile and preferences from the API |
| `lib/game/mock-room.ts` | Splash room engine with bots; exposes `{ state, actions }` | Real-time room from the backend. The imposter's device must never receive the secret word |
| `lib/kay/speech.ts` | Read-aloud via the browser's built-in speech | Recorded or AI voiceover (plan §4) |

## Gaps against the current product plan

The UI was started from an earlier version of the plan. These differences need a team decision.

1. **Core journey missing:** there are no screens yet for choose subject → upload screenshots → confirm extracted content → study plan (plan §0).
2. **Age group:** the plan now says 10–18. The demo content (basic Solar System) and the Explain screen's age bands (5–7, 8–10, 11+) are pitched younger.
3. **Name:** the UI uses the placeholder **"Kay"** (one constant, `APP_NAME` in `lib/kay/data.ts`); the plan's working title is "Rejected by Y Combinator".
4. **Party games:** the recommended prototype is one-device pass-the-phone play (Concept on your forehead, Forbidden clues, Knowledge relay). Splash is a phone-each imposter game. In the plan's "Secret concept" version, the odd one out gets a *related concept*; in Splash they get nothing.
5. **Leaderboards:** `/compete` shows a class ranking, but the plan lists public leaderboards as unselected.
6. **Login/registration:** no screens yet. "I already have an account" just opens the demo. Screens need building and connecting to the backend's auth API, following its guidance on storing sessions safely.
7. **Avatar overlap:** `/rewards/avatar` and the `codex/diff-character-handoff` branch (character builder) both cover avatar items; agree on one.
8. **AI features are stand-ins:** tutor answers, parent explanations and the animated explainer are pre-written or hand-drawn.
9. **Reward numbers are placeholders:** allowance, points, drop odds and badge unlocks all need values (plan §3, §12).

## Repository note: UI commits on `main`

The two UI commits were pushed to `main` by mistake (`7b8003d`, `bad7e5a`) before landing on `user_interface_v1`. The branch copy (`ade7ba1`, `782decd`) has the same code with corrected commit messages. **Decide whether to keep these on `main` or revert them** and bring the UI in through a pull request from `user_interface_v1` instead.

## Next steps (owners to assign)

- [ ] Decide on the gaps above, especially the core journey, the age group and the name
- [ ] Design and build the upload → review → study-plan screens
- [ ] Build login and registration screens and connect them to the auth API
- [ ] Pick and build the first pass-the-phone party game
- [ ] Replace mock data with backend API calls, screen by screen
- [ ] Resolve the `main` branch commits; open a PR from `user_interface_v1`
- [ ] Test on real phones, with a screen reader and keyboard only
