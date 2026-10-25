# Friends, presence and live duels: FastAPI connection

The frontend now always proxies `/api/social/*` to FastAPI at `LEARNING_API_URL`.
There is no local JSON simulator or silent fallback. `SOCIAL_API` is no longer needed;
the existing `.data` demo files are ignored and are not automatically imported.

The backend is [Parent-Child-Bonding-Game-Backend](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend).
See its [social contract](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/main/docs/FRONTEND_SOCIAL_CONTRACT.md)
and live Swagger `/docs` for all 16 operations, schemas, examples, state rules and rewards.

## Configuration

Frontend `.env.local`:

```dotenv
LEARNING_API_URL=http://127.0.0.1:8001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Use the actual backend origin and existing Clerk keys. Keep the secret server-side.
For a local backend, run `uv run uvicorn app.main:create_app --factory --port 8001` from
that repository after configuring its database, model generation and persistent wallet storage.
The API also needs its exact `CLERK_ISSUER` and authorized application origins; these are backend settings.

In Clerk Sessions → Customize session token, include:

```json
{
  "player_id": "{{user.public_metadata.player_id}}",
  "username": "{{user.username}}"
}
```

The frontend assigns a stable player UUID on first use. It requests a fresh signed session token
when metadata/claims need refreshing, so it does not forward the old pre-allocation token.
After changing Clerk's claim configuration, refresh the session/sign in again.
The backend validates the token signature, issuer, lifetime, authorized party and player binding.
The frontend never invents usernames or identity claims to bypass verification.

## Proxy and initialization

- `app/api/social/[...path]/route.ts` forwards only the social contract paths.
- `lib/server/learning-session.ts` supplies the Clerk Bearer token and server-selected player UUID.
  Browser-supplied Authorization and X-Player-ID are not trusted or forwarded.
- Idempotency keys, content types, bodies, query strings, backend error codes and request IDs survive
  the proxy. Auth rejection becomes a recoverable 403 instead of a login redirect loop.
- `Presence` saves the profile before sending online heartbeats. Failed registration is retried;
  a removed/reset backend profile is registered again. Only one heartbeat runs at a time.
- Friend pages poll existing endpoints; game creation, acceptance, countdowns, answers and results
  use `lib/social-api.ts`. The backend's timing/cadence fields drive the existing UI.
- No login, identity-provider, or account-management backend is implemented in this frontend repo.

## Server wallet after duels

FastAPI awards a completed social duel once. The results screen displays the computed award
(zero for idle players) and reloads `/api/me/wallet`; it never adds coins or quest counts locally.
Retries replace the cached balance instead of minting another reward. An in-flight reply from
an old account cannot overwrite the newly selected account's cache.
The general proxy now supports `/me`, `/homes`, `/shop`, `/rooms`, `/matches`, and `/challenges`,
including PUT/PATCH and idempotency headers, for existing backend clients.
Other prototype screens that still modify local learning/home/shop state are separate migrations;
this change connects the social/live-duel flow and its wallet display.

## Verification

Run `npm test`, `npm run typecheck`, and `npm run build`. CI also lints app/components/lib/tests.
Tests exercise trusted proxy identity, fresh-token minting, error/body preservation, all 16 social
route shapes, profile recovery, repeated wallet refreshes and account-switch races.
`tests/social-roundtrip.test.ts` can additionally run against an isolated real FastAPI fixture
with synthetic RSA tokens via `SOCIAL_INTEGRATION_FIXTURE` (a JSON file containing the fixture's
URL and synthetic player tokens). Never use real tokens or a shared production backend for that fixture.
