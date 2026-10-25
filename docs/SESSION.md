# Sessions and player identity

Clerk owns account authentication. Next.js links the account to an existing backend player UUID. Implementation: `lib/server/learning-session.ts`, `lib/server/session.ts`, `lib/use-user.ts` and the auth route handler.

## Request flow

1. Sign in/verify through Clerk.
2. The browser calls `POST /api/auth/session`; app pages initialize as a fallback.
3. The server uses a signed `player_id` claim, or reads/creates a UUID in Clerk public metadata. A per-process promise deduplicates concurrent local allocation.
4. After metadata allocation, or if social claims are missing, it obtains a fresh token.
5. It initializes backend profile/name data. Failure does not undo Clerk login.
6. Proxies add the session Bearer token and `X-Player-ID`. Browser identity headers are not forwarded.

Configure Clerk session claims:

```json
{
  "player_id": "{{user.public_metadata.player_id}}",
  "username": "{{user.username}}"
}
```

Clerk `sub` identifies the account and is the social API user ID. The UUID identifies learning/home/wallet partitions. Do not interchange them.

## Actual trust boundary

Only `/api/social/*` verifies Clerk tokens, binds subject/issuer to the signed player UUID and rejects a conflicting header. Configure the backend issuer/parties; see [social setup](SOCIAL_API.md).

Other backend routes ignore Bearer authentication and accept unverified `X-Player-ID`. Without it they share `00000000-0000-4000-8000-000000000001`. Anyone reaching those routes can choose another partition. Frontend login does not add identity verification to a direct backend call.

The guardian proxy replaces the mailbox filter with the signed-in user's verified primary email. Direct backend guardian routes still accept caller-provided mailbox/player context and separate workflow proofs. Role labels do not prove guardianship.

## Responses

Session initialization returns `user`, `learning` and `refreshToken`. A false `learning` reports failed backend initialization; true `refreshToken` requests a token refresh after player allocation.

No frontend session returns 401. Upstream 401 becomes recoverable 403 with `session_rejected` to avoid a login loop. Connection/provider lookup failures return sanitized 503. API responses are no-store.

The browser selects local cache per Clerk account; wallet/economy clients guard account-switch replies and the shell remounts content. Some display preferences and streak date state remain device-wide. Local storage is not authorization.
