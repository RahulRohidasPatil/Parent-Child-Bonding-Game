# Backend instructions for AI contributors

Read the repository-root `AGENTS.md`, then this file. These instructions apply to `backend/`.

## Start here

1. Read `../docs/AI_HANDOFF.md` for product decisions, branch status, and unfinished work.
2. Read `README.md` for setup and `API.md` for the request/response contract.
3. Inspect `app/main.py`, `app/config.py`, `app/models.py`, and relevant tests before editing.
4. Inspect `git status` and the current branch. Preserve unrelated work; use an isolated
   worktree when another task is editing the frontend or the same files.
5. Check current remote PR state rather than assuming the demo PR has been merged.

The product plan is a backlog, not proof that any feature exists. Source and tests establish
implemented behaviour. Resolve conflicts using the latest user instruction and inspect the code.

## Current scope

This backend is an authentication foundation. The user requested **backend-only** changes and
explicitly deferred SMTP/real email delivery. Do not build frontend screens or configure a mail
provider simply because earlier plans mention them. The current hackathon path uses offline demo
accounts. New game, learning-content, upload, and family-linking endpoints are not implemented.

## Architecture and invariants

- `create_app` is an application factory; use `app.main:create_app --factory`.
- Settings load `.env` relative to the working directory. Run commands from `backend/`.
- Supabase mode uses a shared HTTP connection pool, **not** a shared user session. Pass each
  user's Bearer token explicitly. Verify identity through Supabase; do not trust decoded JWTs.
- Demo mode is isolated from Supabase. Keep its default off, require development/test mode,
  reject production startup, and keep demo tokens unacceptable to the normal auth path.
- Demo sessions are in-memory, single-process, and nonpersistent. Preserve independent logins,
  token expiry, refresh rotation/replay rejection, and logout revocation.
- `account_type=learner` represents the child account. Metadata, including `account_type` and
  `demo_family_id`, is not permission, proof of age, consent, or a verified family relationship.
- Do not add a service-role/admin key or custom password database to this login flow.
- Keep secrets out of commits, logs, errors, URLs, and examples. Published demo passwords are
  deliberately synthetic; never replace them with real credentials in tracked files.
- Preserve validation redaction and `Cache-Control: no-store` on auth responses.
- Keep exact CORS origins and no cookie credentials. CORS is not authorization.
- Do not weaken hosted email confirmation to make a demo work. Use the existing offline mode.
- Any future data route needs ownership/authorization checks independently of login.

## Editing and verification

Keep route contracts compatible with `API.md`, or document deliberate changes in the same patch.
Use Pydantic models, explicit errors, and request-local identity. Extend the existing MockTransport
and demo tests for behavioural changes; do not send real auth emails as a routine test.

From `backend/`:

```sh
uv sync --locked
uv run ruff check app tests
uv run ruff format --check app tests
uv run pytest -q
```

For dependency changes, update `pyproject.toml` and regenerate `uv.lock` with `uv lock` before
running `uv sync --locked`. Do not hand-edit the lockfile. Documentation-only edits need link,
example, and source-contract checks; they do not require repeated runtime tests without a reason.

Update the backend README, API reference, and AI handoff when behaviour or scope changes. Use
`codex/` branches. Inspect the exact staged diff; exclude `.env`, caches, virtual environments, and
unrelated frontend work. Report checks and limitations honestly. Push requested work, but do not
merge a PR unless the user asks. Reuse existing GitHub credentials without printing tokens or
changing the active global account merely to perform a scoped operation.
