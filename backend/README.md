# Authentication backend

- [AI handoff and delivery status](../docs/AI_HANDOFF.md)
- [AI contributor instructions](AGENTS.md)
- [Detailed API contract and mode differences](API.md)

FastAPI authentication API with Supabase and isolated offline demo modes. This backend work does not change the Next.js frontend.
No custom user table, database password, service-role key, or FastAPI password database is needed:
Supabase owns password hashing, users, email confirmation, sessions, and recovery.

## Offline demo mode — no Supabase or SMTP required

From this directory:

```sh
cp .env.demo.example .env
uv sync --locked
uv run uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

Use one worker. Demo sessions live in memory and reset when the process restarts or reloads;
multiple workers/replicas do not share them. Open http://localhost:8000/docs to try the API. If port 8000 is in use, choose another port (for example 8001) and use that port in requests.
`GET /health` reports `auth_mode: demo`, and demo identities carry `user_metadata.demo: true`.
`GET /auth/demo-accounts` lists the two synthetic accounts without their passwords.

| Demo account | Email | Demo password | API account type |
| --- | --- | --- | --- |
| Parent: Alex | `parent@demo.example.com` | `DemoParent123!` | `parent` |
| Child: Sam | `child@demo.example.com` | `DemoChild123!` | `learner` |

These published credentials are only for the local demo. They are not Supabase users or real
mailboxes. The shared `demo_family_id` is sample metadata, not a verified guardian relationship
or a family authorization system. No schoolwork, progress, or real personal data is seeded.

1. POST `/auth/login` with a demo email and password.
2. Use the returned access token as a Bearer token for GET `/auth/me`.
3. POST `/auth/refresh` with the refresh token. Both old tokens become invalid immediately.
4. POST `/auth/logout` with the current access token. Both current tokens become invalid.

Access tokens expire after one hour; refresh sessions expire after 24 hours from their latest
issuance. Each login has independent random tokens. At most 1,000 active sessions are retained.
Demo registration, confirmation, resend, recovery, and password changes return 409: use the seeded
accounts instead. The demo never sends email, connects to Supabase, or changes hosted auth settings.

Demo mode is **off by default**. Enabling it requires both `DEMO_MODE=true` and
`APP_ENV=development` (or `test`); `APP_ENV` defaults to `production` and refuses demo startup.
Keep demo mode bound to localhost, do not deploy the published accounts publicly, and use
`DEMO_MODE=false` for Supabase/production. Supabase mode rejects demo token prefixes before
contacting Supabase and does not expose the demo account-list endpoint.

## Run locally with Supabase

Install [uv](https://docs.astral.sh/uv/), then from this directory:

```sh
cp .env.example .env
# Fill SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from the project's Connect dialog.
uv sync --locked
uv run uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000 --no-access-log
```

The configured local `.env` is ignored by Git; teammates must create their own. Copy the chosen template only when creating a new configuration; preserve an existing `.env` unless deliberately switching modes.
Use Python 3.12 or later. Open http://localhost:8000/docs for the interactive API contract.
`GET /health` checks process health, not Supabase availability. Missing/invalid Supabase configuration fails startup when demo mode is disabled.
`uv run pytest -q` runs the mocked integration suite. `uv run ruff check app tests` and
`uv run ruff format --check app tests` check style.

## API contract

| Method | Endpoint | Input / result |
| --- | --- | --- |
| POST | `/auth/register` | `email`, `password`, `display_name`, `account_type` (`learner` or `parent`); returns generic 202 confirmation instructions |
| POST | `/auth/login` | `email`, `password`; returns access/refresh tokens, expiry, and user |
| POST | `/auth/verify` | `type` (`signup` or `recovery`) and either `email` + `token`, or `token_hash`; returns a session |
| POST | `/auth/resend` | `email`; requests another signup confirmation email |
| POST | `/auth/refresh` | `refresh_token`; returns a rotated session |
| GET | `/auth/me` | Bearer access token; returns identity verified by Supabase |
| POST | `/auth/logout` | Bearer access token; revokes the current refresh session; returns 204 |
| POST | `/auth/forgot-password` | `email`; requests recovery email with generic 202 response |
| PUT | `/auth/password` | Bearer access token and `password`; updates that user's password |

Passwords for registration/update must be 8–128 characters; stronger project-level rules still apply.
Passwords are not trimmed. Display names are trimmed. User metadata is a self-declared display
preference, **not** a verified age, guardian relationship, or authorization role. Parent/child linking,
consent, game data, uploads, and profile authorization are separate future work.

Use `Authorization: Bearer <access_token>` for protected endpoints. No auth cookies are set by this API.
A future browser frontend needs an explicit secure session strategy; do not persist refresh tokens in
localStorage by default. A same-origin server-side session layer is recommended when UI work begins.
Replace the refresh token after every successful refresh and serialize refresh requests per session.
On logout, clear client tokens; issued access JWTs can remain valid until expiry even after refresh-token
revocation. Password updates also require the client to handle session/token changes and sign out as appropriate.

No response containing authentication data should be cached. The API adds `Cache-Control: no-store`.
Validation errors and upstream failures omit raw submitted values and provider debug messages.
CORS is restricted to the configured exact origins and does not enable cookie credentials.
CORS is not authentication or a rate limiter. Supabase's upstream auth rate limits remain in force;
add per-client edge limits before public deployment. Do not log request bodies, auth headers, tokens,
or email-link query strings. The example server command disables access logging.

## Supabase project setup and email limitation

**Current decision:** SMTP and real email delivery are intentionally deferred for the hackathon. Use offline demo mode; no Resend or other sender setup is required for it. The following notes apply only if real email delivery is requested later.

Project observations below were made during setup and must be rechecked before deployment.
Inspected project: **Partygame for ed**. Email provider and new signups are enabled;
email confirmation is required. No security setting was disabled to make testing easier.
The project uses Supabase's default mailer; no custom SMTP credentials were supplied.
Its dashboard requires custom SMTP (or a paid email-template option) for editing templates.
Default mail delivery also has recipient restrictions and low sending limits; public delivery is not
configured by this change. See [Supabase's default SMTP restrictions](https://supabase.com/docs/guides/auth/auth-smtp).

The API supports both OTP verification and token-hash verification. Default confirmation/recovery
emails contain a link, not necessarily a visible OTP. For developer testing, the link's `token` query
parameter is the **token hash**, which can be submitted to `POST /auth/verify` with the matching type.
Do not click the link first: verification consumes it. Treat the link/hash as a credential; never commit it.
A normal user should not need to extract a hash. The final public email/redirect UX is pending SMTP
and the later frontend, not completed by this backend-only change.

Once a sender is available, add the following to the matching email templates to support code entry
without browser callbacks:

```html
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
```

Signup: register → read signup code → verify with `type: signup` → use returned session.
Recovery: forgot-password → read recovery code → verify with `type: recovery` →
PUT `/auth/password` using the returned access token. An ordinary signed-in user may also update
their own password without requesting recovery.

Keep email confirmation enabled. Keep anonymous sign-in and unused OAuth providers disabled.
The existing Site URL is `http://localhost:3000`; a local callback URL is allowlisted for later UI work,
but there is no frontend auth callback implementation in this branch. OTP/hash verification needs
no redirect. Before deployment, configure the actual HTTPS frontend Site URL and exact callback URLs,
SMTP sender, production backend environment, allowed CORS origins, and TLS. No production domain
was provided, so none was guessed or deployed. No additional Supabase GitHub integration is needed
for API connectivity; setting up that integration would grant separate repository permissions.

## What was verified

The test suite mocks Supabase to exercise session isolation, login and refresh grants, registration,
verification methods, token enforcement, logout, password updates, validation redaction, error handling,
and CORS. Live smoke checks validate configuration against Supabase and reject missing/invalid tokens.
The offline demo login/identity/refresh/logout flow was also smoke-tested locally.
No real signup, mailbox confirmation, or successful password reset has been claimed without a test
mailbox/sender. No frontend, game engine, OAuth, family linking, or application tables are implemented.
