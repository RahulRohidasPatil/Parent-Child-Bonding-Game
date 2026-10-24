# AI handoff — backend

This is the continuation guide for the Parent–Child Bonding Game, working title
**Rejected by Y Combinator**. It describes implemented backend behaviour, not the full product.

## Read in this order

1. Repository-root `AGENTS.md` and [backend contributor instructions](../backend/AGENTS.md).
2. [Backend README](../backend/README.md): environment, startup, demo credentials, checks.
3. [API reference](../backend/API.md): routes, payloads, errors, and mode differences.
4. [Product plan](PRODUCT_PLAN.md): intended features and open product decisions.
5. The actual source and tests before implementing or reporting a feature.

## Delivery snapshot — 24 October 2026

| Work | State at this snapshot | Evidence |
| --- | --- | --- |
| Supabase authentication API | Merged into `main` | [Authentication PR](https://github.com/RahulRohidasPatil/Parent-Child-Bonding-Game/pull/1) |
| Offline parent/child demo authentication | Implemented and pushed; open PR, not yet merged | [Demo PR](https://github.com/RahulRohidasPatil/Parent-Child-Bonding-Game/pull/2), branch `codex/backend-demo-auth` |
| Backend documentation and AI handoff | Added to the demo PR by this documentation change | This file, backend README/API/AGENTS |
| Tests | 36 passing at the demo implementation commit; GitHub backend checks passed | `backend/tests/test_auth.py` and `backend/tests/test_demo.py` |
| SMTP, real email-delivery demo, public deployment | Deferred, not required by the user for this hackathon stage | Latest user decision |

This is a dated snapshot. Recheck branches and PRs before claiming current merge/check status:

```sh
git status --short
git branch --show-current
gh pr list --repo RahulRohidasPatil/Parent-Child-Bonding-Game --state all
gh pr checks 2 --repo RahulRohidasPatil/Parent-Child-Bonding-Game
```

Use the GitHub account with repository access. Account `Vl4dC` had write access when this guide
was written. Another locally authenticated account did not. Do not print tokens, assume global
credentials are correct, or infer access failure means the repo is empty. No token belongs here.

## What exists

- Python 3.12+, FastAPI, Pydantic settings/models, HTTPX, Uvicorn, uv dependency lockfile.
- Supabase Auth adapter for registration, login, verification, resend, refresh, identity, logout,
  recovery, and password update. Supabase owns the real users/passwords/sessions.
- An isolated offline alternative with two synthetic accounts and expiring random tokens.
- Input validation, redacted validation errors, sanitised provider errors, no-store auth responses,
  explicit CORS origins, and Bearer-token protected identity/password/logout endpoints.
- Mocked upstream integration tests and offline demo tests, plus GitHub Actions backend checks.
- A separate Next.js frontend tree exists. Its current implementation may be changing in another
  task; inspect it if needed, but do not edit it under the backend-only request.

## What does not exist

There are no custom application tables, SQL migrations, configured upload buckets, persistence
for demo data, verified parent/child links, guardian consent workflow, subject catalogue, material
upload/OCR, AI generation, review/publish flow, flashcard content, quiz scoring, party-game engine,
multiplayer rooms, progress tracking, quests, rewards, inventories, or avatar backend yet.
Do not infer these from `docs/PRODUCT_PLAN.md` or the presence of Supabase in the stack.

There is no frontend session/cookie layer, implemented auth email callback, OAuth login, or completed
production deployment in this backend change. Live checks only proved Supabase connectivity and
rejection of invalid tokens. Real signup/confirmation/recovery delivery was not tested end to end.
The offline demo login/identity/refresh/logout flow was smoke-tested locally.

## Latest product decisions

- Keep changes backend-only unless the user explicitly expands the task.
- Do not resume SMTP work automatically. User explicitly chose a demo without working email.
- Target ages are 10–18; parents/guardians are a primary use case, but friends-only play is allowed.
- Intended core flow: subject → uploaded school material → confirmed source → learning modules → games.
- Uploaded material and AI output are not automatically verified. Source confirmation and review are
  part of the plan; no review pipeline or zero-hallucination guarantee exists yet.
- Casual versus ranked competition and module-to-game unlock rules remain open.
- The DevOps workplace learning game is a separate idea, outside this repository's backend scope.

## Architecture map

| Path | Responsibility |
| --- | --- |
| `backend/app/main.py` | App factory/lifespan, routes, Supabase HTTP adapter, auth dependency, CORS and errors |
| `backend/app/config.py` | Environment parsing, mode guard, key type validation, CORS constraints |
| `backend/app/models.py` | Request validation and public user/session/message response shapes |
| `backend/app/demo.py` | Seed identities, in-memory token issuance, expiry, rotation and revocation |
| `backend/tests/test_auth.py` | Supabase adapter and response/security behaviour using MockTransport |
| `backend/tests/test_demo.py` | Offline behaviour, mode separation, expiry, refresh replay, logout and restart |
| `backend/pyproject.toml`, `backend/uv.lock` | Dependencies and repeatable Python tooling |
| `.github/workflows/backend.yml` | Ruff lint/format and pytest on Python 3.12 |

## Recommended next work, when requested

1. Merge the demo PR only after user authorization and fresh checks.
2. Agree the initial subject and smallest demo upload-to-learning flow.
3. Define request/response models and an ownership model before adding application persistence.
4. Implement one vertical slice with tests and API documentation. Decide explicitly whether its
   storage/content are synthetic demo fixtures or real services; report that distinction.
5. Add game/session/progress/reward functionality later, one reviewed slice at a time.

Do not implement the entire backlog, introduce paid services, or deploy a public demo merely
because they are listed here. Continue the user's actual task and preserve unrelated edits.

## Known operational limits

- Run demo mode on localhost with one worker. Restart/reload resets all sessions; replicas do not
  share memory. Published demo credentials must not be used as a production access mechanism.
- Demo refresh rotates both tokens immediately; Supabase JWTs may survive logout until expiry.
- Demo child metadata uses `learner`, not `child`. Stable IDs and `demo_family_id` are fixtures only.
- A parent label must never permit reading another learner's data without future explicit linkage
  and authorization rules.
- API returns Bearer tokens, not cookies. The future browser integration still needs a deliberate
  secure session strategy and must handle token rotation.
- `.env` is local and ignored. Copy a template only if no existing configuration needs preserving.
- `GET /health` reports process/mode health, not an upstream/database readiness guarantee.
- Supabase dashboard observations in the README are historical and must be rechecked before
  relying on them for deployment. No custom SMTP has been configured by this backend work.
- Current tests emit a Starlette TestClient/HTTPX deprecation warning, but pass. Do not suppress it
  as proof of compatibility; address it if upgrading the test stack becomes part of the task.
