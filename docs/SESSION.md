# Session after login

How a signed-in user becomes a player on the learning service, and how the backend can take
this over without frontend changes.

## Today

The learning service has no login. It ignores `Authorization`, and the `X-Player-ID: <uuid>`
header alone selects whose lessons, quizzes and chats a request sees. Without the header, every
request shares one default player. The frontend therefore gives each Clerk account its own
player:

1. The user logs in with Clerk (`app/(auth)/login/login-form.tsx`).
2. The browser calls `POST /api/auth/session` (`startSession()` in `lib/use-user.ts`). App pages
   repeat this once per tab as a fallback, which covers email-link sign-up and older logins.
3. The server (`lib/server/learning-session.ts`):
   - reads the account's player id from Clerk public metadata, `player_id`. On first use, it
     creates a random UUID and saves it there;
   - tells the service who the player is, using
     `PUT /api/memory/profile {role, display_name}` and `PUT /api/me/profile`.
4. Every later learning call goes through our same-origin proxy (`/api/*`). The proxy adds two
   headers before forwarding:

   | Header | Value | Used by the service today |
   | --- | --- | --- |
   | `Authorization` | `Bearer <Clerk session JWT>` | No (ignored) |
   | `X-Player-ID` | the account's `player_id` | Yes (data partition) |

The browser never sees or sets either header for the learning service. All server code calls the
service through `learningFetch()` / `forwardToLearning()` in `lib/server/learning-session.ts`.

Local browser state (coins, looks, home, recent lessons) is kept per account
(`setAccount()` in `lib/store.ts`).

## Response of `POST /api/auth/session`

```json
{ "user": { "id": "user_…", "username": "zara_k", "name": "Zara", "accountType": "learner", "age": 11 },
  "learning": true,
  "refreshToken": false }
```

- `learning: false` means the learning service couldn't be reached. Login still succeeds, and
  the next page load tries again.
- `refreshToken: true` means a player id was just created. The browser then refreshes its Clerk
  token so the token carries the new id.

## Taking it over in the backend

1. **Put the player id in the Clerk token.** In the Clerk dashboard, open Sessions, then
   Customize session token, and add:

   ```json
   { "player_id": "{{user.public_metadata.player_id}}" }
   ```

   The frontend then reads the id from the verified token and stops calling the Clerk API for it.
2. **Verify the token in the service.** Check the `Authorization` JWT against this Clerk
   instance's JWKS (`https://<instance>.clerk.accounts.dev/.well-known/jwks.json`). Check the
   issuer and expiry, and take the player from the `player_id` claim (`sub` is the Clerk user
   id). Reject a request whose `X-Player-ID` differs from the claim, then stop reading the
   header. If the service returns 401, the proxy turns it into a 403 with a message, which
   avoids a login redirect loop.
3. **Own the session step (optional).** If the service gets its own session endpoint (for
   example, one that creates the player and profile from the verified token), replace the body
   of `startLearningSession()` with that one call. The browser contract above stays the same.
4. **Own the player id (optional).** If the service should create player ids itself, return the
   id from that endpoint and save it to Clerk public metadata. Alternatively, make the service
   key players by `sub` and drop `X-Player-ID`. Either way, only `learning-session.ts` changes.

## Notes

- Lessons made before per-account players existed live in the shared default player, so
  accounts don't see them.
- Friends, presence and live duels follow [SOCIAL_API.md](SOCIAL_API.md). They identify users by
  the token's `sub` (Clerk user id), never by player id.
