# Friends, presence and live duels API

This is the contract the frontend uses for friends, online status and live duels. The backend
implements it in FastAPI, with users' data stored in SQLite. Until it ships, this app's Next.js
server answers the same contract from a local stand-in (`lib/server/social-local.ts`). Setting
`SOCIAL_API=backend` switches to the real backend with no other frontend change.

All paths are on the backend under `/api/social`. The browser calls them through our same-origin
proxy at `/api/social/*` (`app/api/social/[...path]/route.ts`), which adds the headers below.

## Authentication

Every request carries the signed-in user's Clerk session token:

```
Authorization: Bearer <Clerk session JWT>
```

The backend must:

1. Verify the JWT against this Clerk instance's JWKS:
   `https://<frontend-api>/.well-known/jwks.json`. The frontend API host is the issuer, for
   example `https://unbiased-owl-9401.clerk.accounts.dev`.
2. Check `exp` and `nbf`, that `iss` equals the issuer above, and, if present, that `azp` is one
   of the app's origins (for example `http://localhost:3000`).
3. Use `sub` (the Clerk user id, `user_…`) as the user's id. Read `username` from the token claim
   of the same name.

Add the `username` claim in the Clerk dashboard under Sessions > Customize session token, next to
the `player_id` claim from [SESSION.md](SESSION.md):

```json
{ "player_id": "{{user.public_metadata.player_id}}", "username": "{{user.username}}" }
```

A missing or invalid token gets `401`. The proxy turns a backend 401 into a 403 with a message,
so the browser doesn't loop back to the login page.

Python example (PyJWT):

```python
jwks = jwt.PyJWKClient(f"{CLERK_ISSUER}/.well-known/jwks.json")
key = jwks.get_signing_key_from_jwt(token).key
claims = jwt.decode(token, key, algorithms=["RS256"], issuer=CLERK_ISSUER, options={"verify_aud": False})
user_id, username = claims["sub"], claims.get("username")
```

## Conventions

- JSON bodies use `snake_case`. Times are ISO 8601 UTC strings, for example
  `2026-10-25T09:30:00.000Z`.
- Errors look like `{"detail": "Friendly sentence shown to the child", "code": "offline"}`.
  `code` is optional and machine-readable.
- The constants below are fixed for the demo. The backend returns them where noted, so the
  frontend never hard-codes them.

| Constant | Value | Meaning |
| --- | --- | --- |
| `heartbeat_s` | 20 | How often the app sends presence while it's open |
| `online_window_s` | 45 | A user is online if their last presence is newer than this |
| `invite_ttl_s` | 30 | How long a duel invite waits for an answer |
| `start_delay_s` | 5 | Countdown between accepting and the first question |
| `seconds_per_question` | 20 | `ends_at = start_at + num_questions × seconds_per_question` |

## Objects

**PublicUser.** `online` and `busy` are only filled in for friends. For anyone else they're
`null`, so strangers never see a child's online status.

```json
{ "id": "user_2x…", "username": "zara_k", "display_name": "Zara", "avatar": "zara",
  "online": true, "busy": false }
```

- `busy` is true while the user is in a duel that is `invited` or `active`.
- `avatar` is one of `nova | mia | zara | leo | sam | mom | dad`.

**FriendRequest**

```json
{ "id": "req_…", "from": PublicUser, "to": PublicUser, "created_at": "…" }
```

**Duel**

```json
{
  "id": "duel_…",
  "status": "invited",
  "my_role": "challenger",
  "challenger": PublicUser,
  "opponent": PublicUser,
  "lesson_title": "Photosynthesis",
  "num_questions": 5,
  "created_at": "…",
  "invite_expires_at": "…",
  "start_at": null,
  "ends_at": null,
  "server_now": "…",
  "questions": null,
  "progress": { "me": 0, "opponent": 0 },
  "results": null
}
```

- **`status`** is one of `invited | declined | expired | cancelled | active | finished`.
- **`my_role`** is `challenger` or `opponent`.
- **`questions`** is `null` until the duel is `active` and `server_now ≥ start_at`. After that it
  holds `[{ "index", "type", "question", "options", "visual_html" }]`, the same shape as a
  learning-service quiz question. Questions never include answers.
- **`progress`** counts the questions each player has answered. It's visible live, but
  correctness isn't.
- **`results`** is `null` until `finished`. Then it is
  `{ "me": Sheet, "opponent": Sheet, "winner": "me" | "opponent" | "draw" }`.
- **Sheet** is `{ "score", "total", "results": [{ "index", "choice", "correct", "answer_index", "explanation" }] }`.
  An unanswered question has `choice: null, correct: false`.
- **`server_now`** lets the client correct for clock drift on countdowns.
- **Status changes on read.** The backend works out `expired` and `finished` whenever a duel is
  read, so no background job is needed:
  - an `invited` duel becomes `expired` once `invite_expires_at` has passed;
  - an `active` duel becomes `finished` once both players have answered every question, or once
    `ends_at` has passed.

## Endpoints

### Profile

`PUT /api/social/me` with `{ "display_name": "Zara", "avatar": "zara", "role": "learner" }`
returns `200 { "id", "username", "display_name", "avatar", "role" }`.

The app calls this after each login and whenever the user's look changes. It creates or updates
the user's row. `role` is `learner` or `parent`. The username comes from the token, never from
the body. Only users who have called this at least once can be found in search.

### Presence

`POST /api/social/presence` with `{ "state": "online" }` or `{ "state": "offline" }` returns:

```json
{ "heartbeat_s": 20, "online_window_s": 45, "invites": [Duel] }
```

- **`online`** sets `last_seen_at = now`. **`offline`** clears it; the app sends this with
  `navigator.sendBeacon` when the tab closes.
- **`invites`** lists the duels inviting me (`my_role = "opponent"`) that are still `invited` and
  unexpired. The app shows them as a pop-up from any page.

### Search

`GET /api/social/users/search?q=<text>&limit=10` returns:

```json
{ "users": [PublicUser & { "relationship": "none" | "friend" | "request_sent" | "request_received" }] }
```

- The search is a case-insensitive prefix match on username. `q` needs at least 2 characters
  (otherwise `422`), and `limit` is between 1 and 20.
- The results exclude me and are sorted by username.
- There's no browsing everyone: a child finds people only by typing their username.

### Friends

`GET /api/social/friends?online=true` returns:

```json
{ "friends": [PublicUser & { "since": "…" }], "incoming": [FriendRequest], "outgoing": [FriendRequest] }
```

- `online=true` returns only friends who are online. Leaving it out returns everyone.
- Friends are sorted online first, then by display name.

| Call | Result |
| --- | --- |
| `POST /api/social/friend-requests` `{ "username": "zara_k" }` | `201 { "status": "sent", "request": FriendRequest }`, or `200 { "status": "accepted", "friend": PublicUser }` if they had already asked me |
| `POST /api/social/friend-requests/{id}/accept` | `200 { "friend": PublicUser }` (receiver only) |
| `POST /api/social/friend-requests/{id}/decline` | `204` (receiver only) |
| `DELETE /api/social/friend-requests/{id}` | `204` (sender cancels) |
| `DELETE /api/social/friends/{user_id}` | `204` |

Errors:

| Status | When |
| --- | --- |
| `404` | Unknown username, or a request that is gone or isn't mine |
| `409` | Already friends, or already requested |
| `422` | Asking yourself, or a malformed username |

### Live duels

| Call | Who | Result |
| --- | --- | --- |
| `POST /api/social/duels` `{ "opponent_id", "lesson_id", "num_questions": 3–8 }` | challenger | `201 Duel` (`invited`) |
| `GET /api/social/duels/current` | either | `200 Duel` for my `invited` or `active` duel, else `404` |
| `GET /api/social/duels/{id}` | either | `200 Duel` |
| `POST /api/social/duels/{id}/accept` | opponent | `200 Duel` (`active`, with `start_at = now + start_delay_s`) |
| `POST /api/social/duels/{id}/decline` | opponent | `200 Duel` (`declined`) |
| `POST /api/social/duels/{id}/cancel` | challenger, while `invited` | `200 Duel` (`cancelled`) |
| `POST /api/social/duels/{id}/answers` `{ "index", "choice" }` | either | `200 { "answered": n }` |

**Creating a duel**

- The opponent must be a friend (`403` otherwise), and must be online and not busy (`409` with
  `code` `offline` or `busy`). The challenger must not be busy either (`409`, `code: "busy"`).
- The backend writes the question set from the challenger's lesson, using the challenger's
  learning data (the same generation as `POST /api/tournament`). This takes 20–40 s. It checks
  that the opponent is still online afterwards, and keeps the answer key server-side.
- `num_questions` outside 3–8 gets `422`. A lesson that isn't found gets `404`.

**Accepting, declining and cancelling**

- Accepting after the invite expired, or after the challenger cancelled, gets `409`. So does
  declining or cancelling a duel that isn't `invited`.

**Answering**

- Each question can be answered once per player.
- Answering only works while the duel is `active` and `start_at ≤ now < ends_at` (`409`
  otherwise).
- `index` and `choice` must be valid (`422` otherwise).
- A repeat of the same answer returns the same result. A different answer to an answered
  question gets `409`.

**Typical flow**

1. The challenger creates the duel.
2. The opponent's next heartbeat shows the invite, and they accept it.
3. Both apps poll `GET /duels/{id}` about every 2 s, count down to `start_at`, and get the
   `questions`.
4. Each player posts answers one at a time, and sees the other's `progress` live.
5. Once the duel is `finished`, both apps show `results`.

## Suggested SQLite tables

This is a suggestion only; the backend owns its own schema.

```sql
CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE COLLATE NOCASE NOT NULL,
  display_name TEXT NOT NULL, avatar TEXT NOT NULL, role TEXT NOT NULL,
  last_seen_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE friend_requests (id TEXT PRIMARY KEY, from_id TEXT NOT NULL, to_id TEXT NOT NULL,
  created_at TEXT NOT NULL, UNIQUE (from_id, to_id));
CREATE TABLE friendships (user_a TEXT NOT NULL, user_b TEXT NOT NULL, created_at TEXT NOT NULL,
  PRIMARY KEY (user_a, user_b), CHECK (user_a < user_b));
CREATE TABLE duels (id TEXT PRIMARY KEY, challenger_id TEXT NOT NULL, opponent_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL,
  invite_expires_at TEXT NOT NULL, start_at TEXT, ends_at TEXT,
  questions_json TEXT NOT NULL, answer_key_json TEXT NOT NULL);
CREATE TABLE duel_answers (duel_id TEXT NOT NULL, user_id TEXT NOT NULL, idx INTEGER NOT NULL,
  choice INTEGER NOT NULL, answered_at TEXT NOT NULL, PRIMARY KEY (duel_id, user_id, idx));
```
