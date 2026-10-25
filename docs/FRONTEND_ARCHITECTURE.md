# Frontend architecture

This guide describes frontend `67b663f`, reviewed on 25 October 2026. Start with the [project guide](PROJECT_GUIDE.md) for product context and cross-service flows. The implementation is a Next.js App Router application, with TypeScript, React, Tailwind CSS and Clerk.

## Repository map

| Location | Responsibility |
| --- | --- |
| `app/layout.tsx`, `app/globals.css` | Clerk provider, bundled Nunito font, metadata, global tokens and preference boot script |
| `app/(auth)/` | Login, registration, verification and email-link callback |
| `app/(app)/` | Signed-in product routes, generally with a page wrapper and a client screen |
| `app/api/` | Session endpoints and allowlisted FastAPI proxies |
| `proxy.ts` | Clerk middleware protection for application page families |
| `components/qn/` | Current QuestNest shell, learning/game components, sprites and base renderer |
| `components/ui/` | Shared input/button/dialog primitives |
| `components/game/`, `lib/game/` | Earlier party-game UI/rules and mock-room machinery; not proof of a connected backend game |
| `components/kay/`, `lib/kay/` | Earlier interface/support modules; trace actual imports before treating them as current architecture |
| `lib/*-api.ts` | Domain-oriented browser API clients |
| `lib/server/` | Server-only user projection, player mapping and upstream transport |
| `lib/store.ts`, `lib/prefs.ts` | Browser state/cache and immediate display preferences |
| `public/`, `HackAssets/`, `handoffs/` | Runtime assets, source packs and character-builder references; not all source assets ship in every screen |
| `scripts/` | Asset preparation, including furniture sync and app icons |
| `tests/`, `.github/workflows/frontend.yml` | Unit/component/optional contract checks and CI |

The dependency versions are recorded in `package.json` and locked in `package-lock.json`: Next.js 16.4.3, React/React DOM 19.3.0, Clerk Next.js 7.x, TypeScript 5.x and Tailwind 4.x. Use the lockfile for repeatable installs. This repository's Next.js contributor instructions require checking the installed framework documentation before changing code because this version differs from older conventions.

## Route map

Route groups organize files without adding URL segments.

| URL | Purpose | Main client/domain modules |
| --- | --- | --- |
| `/` | Landing | `app/page.tsx` |
| `/login`, `/register`, `/signup`, `/verify`, `/verify/callback` | Account entry and verification; `/signup` points into registration | `lib/registration.ts`, Clerk hooks, `lib/use-user.ts` |
| `/home` | Dashboard | Store cache and learning/economy summaries |
| `/learn` | Server library, local study plans | `library-api.ts`, `store.ts`, `study-plan.ts` |
| `/learn/new` | Chat, topic and upload entry | `learn-api.ts`, `memory-api.ts`, `learn-chat.ts` |
| `/learn/material/[id]`, `/learn/material/[id]/review` | Material selection and extraction review | `learn-api.ts` and review requests |
| `/learn/lesson/[id]` | Lesson, visuals, follow-up chat, completion | `learn-api.ts`, `VisualFrame` |
| `/learn/plan/[id]/[n]` | Local study-plan subtopic | `study-plan.ts`, saved lesson ID |
| `/learn/queue` | Background job status/cancellation | `games-api.ts` jobs client |
| `/play/solo/quiz/[id]`, `/review` | Saved practice, review and retry | Learning transport and quiz lifecycle endpoints |
| `/play/solo/flashcards/[id]` | Saved review and fresh passes | `learn-api.ts` |
| `/play`, `/play/duel` | Game selection and same-device duel | `games-api.ts`, `learn-api.ts`, `economy-api.ts` |
| `/play/challenge/new`, `/play/challenge/[id]` | Create/view generated challenge | `games-api.ts` |
| `/play/rooms`, `/play/match/[id]` | Lobby and server-clocked room game | `games-api.ts`, Heads-up and diagram components |
| `/play/rebuild`, `/play/race/[id]` | Optional saved-diagram race | `diagram-api.ts` |
| `/play/weekly` | Weekly preview/sample | `games-api.ts` |
| `/base`, `/base/visit/[friend]` | Home construction/layout and visits | `home-api.ts`, `use-live-home.ts`, `home-data.ts` |
| `/shop`, `/quests`, `/profile` | Catalog, rewards, equipment and profile | `economy-api.ts`, `wallet-api.ts`, `profile.ts` |
| `/friends` | Search, requests, presence, live duels | `social-api.ts`, `social-profile.ts` |
| `/settings`, `/settings/activity`, `/settings/family` | Preferences, factual activity, deletion and optional approval requests | `settings-api.ts`, domain clients |

`next.config.ts` redirects old quiz and flashcard Learn URLs into the current Solo routes. Preserve these redirects when changing navigation; saved links may still use the old addresses.

## Rendering and responsive shell

`app/(app)/layout.tsx` mounts `AppShell`. The shell provides a skip-to-content link, the account-keyed content subtree and presence component. Navigation has three layouts: bottom tabs below 768 px, a side rail from 768 px, and a full sidebar from 1280 px. Path-aware navigation sits behind Suspense, with a fallback that renders unhighlighted links.

Interactive screen state lives in client components. Server-only identity and upstream helpers are marked `server-only`; they must not be imported into browser code. This keeps the Clerk secret and private backend configuration on the server.

The root layout applies display preferences before first paint, avoiding an immediate resize/contrast change after hydration. It uses a locally bundled font and its SIL OFL license. The reviewed launch revision forces a light color scheme; text size, contrast and reduced-motion controls remain. A `theme` field still exists in the backend preferences type for compatibility, but does not mean this revision offers a dark-mode UI.

## API boundary

All supported browser domain calls use same-origin `/api` paths. There are four route groups:

| Route handler | Behavior |
| --- | --- |
| `app/api/auth/[action]/route.ts` | `GET me`, `POST session`, compatibility logout response; account authentication itself is Clerk's responsibility |
| `app/api/[...path]/route.ts` | Current general domain allowlist, including learning, home, rooms, matches, jobs, guardian and shop operations |
| `app/api/learn/[...path]/route.ts` | Compatibility alias for a smaller learning allowlist; removes the `learn` segment upstream |
| `app/api/social/[...path]/route.ts` | Strict social route-shape allowlist; adds `social/` upstream |

`forwardToLearning` resolves the session, sets `X-Player-ID` and a Bearer token, and performs a no-store request to `LEARNING_API_URL`. Incoming browser identity headers are not copied. Selected content, idempotency and receipt headers are forwarded; response content type, request ID and retry delay are retained. Guardian queries are replaced with the verified primary mailbox selected on the server.

Errors have deliberate meanings:

- No signed-in frontend session → 401; the general learning client navigates to login.
- Upstream rejects a token with 401 → proxy returns 403 with `session_rejected`, allowing recovery without a login redirect loop.
- Clerk lookup or backend connection failure → sanitized 503.
- Domain validation, state conflicts and other upstream statuses → preserved for the screen to display.

Typed TypeScript clients document expected shapes but do not perform complete runtime schema validation of every backend response. Keep them aligned with FastAPI models and contract tests. Before exposing a new route, update both the backend and the appropriate proxy allowlist/method export.

## State and synchronization

`lib/store.ts` is a small external store consumed through `useSyncExternalStore`. It persists under `qn.state.v1.<Clerk user ID>` after account selection and subscribes to browser storage events for same-browser synchronization. The initial server snapshot uses defaults; client hydration loads saved values.

The store has two roles that should remain explicit:

1. **Server cache:** wallet, home, inventory, equipment, quests and recent resource IDs are populated from APIs. Current clients replace these values using backend responses.
2. **Device-only state:** study plans, local streak, UI choices and recent ordering still rely on browser storage. Display preferences use `qn.prefs`; the streak helper also uses a separate `qn.lastStudy` date key. These are not all covered by account-specific server synchronization.

Old comments describe all coins/chat/home state as local and learning records as memory-only. Those comments predate the integration. Trace the API client and screen to establish current ownership. Local cached `coins` and `unlimitedCoins` do not bypass backend spending rules.

`library-api.ts` paginates server resources and rebuilds the resource list rather than assuming the local list is complete. `wallet-api.ts` ignores stale requests and replies for a previous account. Economy clients capture the current account key before applying responses. Settings saves are serialized and merge current server preferences because `PUT /me/profile` replaces a whole profile.

`AppShell` keys the main subtree by user ID to clear component state when the account changes. This is complemented by account guards in clients; it is not a universal guarantee that every possible in-flight request is cancelled.

### Live updates

The current frontend polls HTTP endpoints; it does not depend on Supabase Realtime or a WebSocket connection. The home refreshes on load, focus and visibility changes, normally every five seconds while visible. Refresh pauses during furniture manipulation to avoid jumping back to a server position mid-edit. Room and match screens use their own intervals; the match screen polls every 1.5 seconds and animates the displayed timer between snapshots.

Presence registers a social profile before heartbeats, retries registration if it has been removed, and uses the returned cadence. Polls do not make browser clocks authoritative: accepted actions and finish times remain server decisions. Interval changes must be checked against the backend per-player request budget.

## Generated visuals

`components/qn/visual-frame.tsx` renders complete backend HTML using `srcDoc` in an iframe with `sandbox="allow-scripts"`, without same-origin permission. It accepts height messages only from that frame's `contentWindow` and bounds the height. This permits a contained interactive visual while keeping it separate from the application's DOM/session.

The backend additionally validates generated code and supplies rendering documents. These controls address containment and structure. They do not prove factual correctness or replace content review.

## Assets, installation and accessibility

Current character/base rendering references frontend assets and rule/size metadata. The server stores choices, positions, levels and item IDs rather than shipping the asset source. Whole-character sprites and modular atelier clothing are different rendering systems: persisting a selected shirt does not make the whole-character preview render that shirt.

`app/manifest.ts`, root Apple metadata and icons support standalone Home Screen launch at `/home`. There is no service-worker caching/offline synchronization implementation in this snapshot. Login, generation and multiplayer require network access.

Existing accessibility measures include semantic navigation labels, current-page markers, labelled controls, keyboard skip navigation, visual titles, preference controls and tap-based label placement. These are implementation measures, not a completed accessibility audit. Test keyboard focus, screen readers, touch targets and reduced motion when changing shared components.

## Extending a feature

1. Identify the canonical backend record and existing API; do not add a local balance or mock success for a server-owned action.
2. Add/update a typed domain client and proxy allowlist if required. Keep secrets and identity mapping in `lib/server/`.
3. Update the screen's loading, empty, stale-version, failure and disabled-feature states.
4. Use expected versions/counters and stable idempotency keys for the same logical mutation. Use a new key for a genuinely new action.
5. Refresh canonical state after a successful mutation; guard account switches where applying a response.
6. Validate with the checks and acceptance journeys in [DEVELOPMENT.md](DEVELOPMENT.md), and update this documentation when ownership or behavior changes.
