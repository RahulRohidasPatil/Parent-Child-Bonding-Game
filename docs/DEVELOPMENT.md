# Development and integration

## Start both services

Use Node.js 22 for the frontend and Python 3.13+ with uv for the backend. Commands run from their respective repository roots.

For a backend demo without model calls:

```sh
cp .env.demo.example .env
uv sync --locked
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8001 --no-access-log
```

Without a database URL, the demo application repository resets on restart. Outside test mode, chat/home SQLite stores still default to files. Set `MEMORY_DB_PATH=:memory:` and `HOME_DB_PATH=:memory:` for those to be ephemeral too. Generation defaults off, so this demo cannot produce new lessons/challenges.

For durable integration, follow the backend README: configure PostgreSQL, explicitly apply ordered migrations and retain both SQLite files. Generation requires provider credentials and enablement. Background jobs need a separate `uv run python -m app.worker` process.

In the frontend, run `npm ci`, copy `.env.example` to `.env.local`, configure Clerk and set `LEARNING_API_URL=http://127.0.0.1:8001`. Run `npm run dev`. The URL is the backend origin, without `/api`.

Configure signed player/username claims for social routes; see [SOCIAL_API.md](SOCIAL_API.md). A working login does not prove backend social verification works.

## Validation

```sh
npx eslint app components lib tests vitest.config.mts
npm test
npm run typecheck
npm run build
```

Typecheck generates Next.js route types before TypeScript checking. Production compilation does not verify live provider access. CI's synthetic public key is for compilation only.

Vitest covers proxy identity, session initialization, social profile recovery, wallet/account races and game components. Optional suites use `SOCIAL_INTEGRATION_FIXTURE` and `GAME_INTEGRATION_FIXTURE`; without files they skip. They require an isolated loopback FastAPI fixture marked synthetic, never a shared service.

For a small acceptance pass: sign in/reload; upload and confirm notes; generate/complete a lesson; finish a quiz and retry its reward claim; buy/equip an item; reconnect two sessions to a supported game. Confirm server state persists and rewards do not duplicate. See [extended journeys](INTEGRATION_TESTING.md). Writing documentation does not constitute running these checks.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Learning returns 503 | Backend process, API origin, database and backend `/ready` |
| Social returns 401/403 | Issuer, signed claims, authorized party, token lifetime and player agreement; refresh the session |
| Login reports `learning: false` | Profile initialization is best effort; restore backend connectivity and reload |
| Generation returns 503 | Backend enablement and provider credentials |
| Job stays queued | Separate worker process and matching database configuration |
| Optional feature unavailable | Feature flag, schema and renderer/mail prerequisites |
| Content disappeared | Persistence, player UUID and demo restart |
| Home version conflict | Refetch before a new edit; preserve body/key for the same retry |
| Unexpected coins | Read the backend wallet; browser defaults are not the ledger |

Keep request IDs for error reports. Never include tokens, receipts, passwords, database credentials or model keys.

Update documentation alongside contracts. Identify canonical storage and restart behavior for new features. Read `AGENTS.md` and the installed Next.js guides before framework code changes.
