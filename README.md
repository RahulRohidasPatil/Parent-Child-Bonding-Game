# QuestNest frontend

QuestNest turns schoolwork into lessons, visual explanations, quizzes, flashcards and games with friends or family. Learners earn coins for a personal base and character items.

**Start with the [project guide](docs/PROJECT_GUIDE.md)** for the whole system, main journeys, data ownership and current limits.

## Run locally

Use Node.js 22 (as in CI) and npm:

```sh
npm ci
cp .env.example .env.local
```

Set real Clerk keys and the backend origin in `.env.local`:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
LEARNING_API_URL=http://127.0.0.1:8001
```

Start FastAPI from the [backend repository](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend), following its README, then run `npm run dev`. Open [localhost:3000](http://localhost:3000). Browser calls go through Next.js server proxies. Never put server secrets in public variables.

Friends/live duels additionally need the backend Clerk issuer and authorized origins, plus these custom Clerk session claims:

```json
{
  "player_id": "{{user.public_metadata.player_id}}",
  "username": "{{user.username}}"
}
```

The frontend assigns a player UUID on first use. Refresh the session after changing token configuration.

## Documentation

| Guide | Covers |
| --- | --- |
| [Project guide](docs/PROJECT_GUIDE.md) | Product, full architecture, journeys, status and limits |
| [Frontend architecture](docs/FRONTEND_ARCHITECTURE.md) | Routes, state, proxies and rendering |
| [Development](docs/DEVELOPMENT.md) | Setup, checks and troubleshooting |
| [Decisions](docs/DECISIONS.md) | Reasons, tradeoffs and when to revisit choices |
| [Sessions](docs/SESSION.md) | Accounts, player UUIDs and trust |
| [Signup](docs/SIGNUP.md) | Registration and verification |
| [Social integration](docs/SOCIAL_API.md) | Friends, presence and live duels |
| [Acceptance journeys](docs/INTEGRATION_TESTING.md) | Manual and optional integration checks |
| [Product plan](docs/PRODUCT_PLAN.md) | Backlog and direction |

## Checks

```sh
npx eslint app components lib tests vitest.config.mts
npm test
npm run typecheck
npm run build
```

Optional real-FastAPI fixture tests skip unless configured. Ordinary checks do not verify real accounts, paid model quality or deployment configuration.

## Current boundaries

The frontend requires sign-in. FastAPI verifies Clerk tokens only on `/api/social`; other endpoints use an unverified player selector. Wallet, shop, quests, home, saved learning and supported room games are connected. Study plans and streaks retain device-level state. Weekly standings are examples. Optional diagram races and approval requests need backend flags/dependencies; approval does not establish family access. Modular clothes are saved, but the preview still renders whole looks.

## Install on iPhone or iPad

Open the HTTPS site in Safari → **Share → Add to Home Screen**, keep **Open as Web App** enabled when offered, and tap **Add**. The manifest opens `/home`. Internet is required for sign-in, server content and multiplayer; installation does not provide offline synchronization.

Documentation snapshot: frontend `67b663f`, backend `a85ec74`, 25 October 2026. Frontend remote fetch failed; the project guide identifies the local launch snapshot.
