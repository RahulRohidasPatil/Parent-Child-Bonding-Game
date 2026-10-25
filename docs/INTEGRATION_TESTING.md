# Integrated backend flows and testing

Frontend API calls go through the signed-in proxy to `LEARNING_API_URL`. The backend keeps Luna
for main generation and Haiku for visual code. No frontend call overrides those model choices.

## Connected journeys

| Journey | Frontend entry | Backend behavior |
| --- | --- | --- |
| Friends and live duels | Friends | Signed social profile, username search, requests, presence, invitation/countdown/answers/results |
| Wallet and purchases | Shop / Profile / Base | One server wallet, catalog prices, purchase, ownership, equipment, room build/place/upgrade/layout, visits/cheers |
| Quests | Quests | Server progress and daily/weekly periods; claims send the displayed period |
| Notes | Learn → upload | Upload, extraction, page preview/correction/revision history, confirmation and deletion |
| Lessons | Learn | Server library, lesson generation, saved visuals, text revision copies, explicit completion |
| Private quizzes | Lesson → quiz | Resume saved first answers, submit/finish, both reward components, retries, review/edit/approval and history |
| Flashcards | Lesson / mistakes | Saved review loop, expected review counters, idempotent fresh passes over the same cards |
| Chat | Chat | Remembered conversations, text/photo questions, reopen/rename/delete saved history |
| Preferences | Settings | Daily goal, theme/accessibility, presence/invite preferences and home visibility |
| Activity | Settings → activity | Factual learning totals, subject digest, wallet history and explicit data deletion |
| Background preparation | Learn → prepare in background | Create, poll, open results and cancel queued work |
| Room games | Play → game room | Rooms, readiness, invites, discovery, start, server-clocked play and participation claims |
| Heads-up | Play → heads-up | Forehead reveal step, correct/skip/violation buttons, role-specific card access, timer, results |
| Diagram match | Play → diagram race | Masked board with slot IDs, tap a word then a slot, move/clear, submit feedback, results |
| Saved-diagram race | Play → rebuild diagram | Prepare template, room ready, study, countdown, versioned placements, finish/forfeit/cancel, results/review |
| Weekly | Play → weekly preview | Current/next preview, sample preparation and clearly labelled example standings |
| Approval requests | Settings → activity → family | Create/poll/resend receipt-protected requests; verified-mailbox proxy filter and proof-based decisions |

Fact Check is excluded from this delivery. Heads-up has no tilt/sensor controls. Diagram uses tap
selection rather than a new drag-and-drop implementation. Other party-game engines that do not
exist on the backend remain labelled unavailable; a preview is not presented as a live tournament.

Backend aliases are reused through the corresponding safer/current flow rather than duplicated
as extra buttons. Operational `/health`, `/ready`, and Swagger remain backend diagnostics.
Study-plan structures and the streak display still have no backend persistence/streak endpoint;
those existing device-level features are not represented as server-synced. Clothing ownership and
selected slots are saved, but the existing character preview still renders its selected full look.

## Setup before live tests

- Use the latest backend main, with required existing database migrations and durable wallet/memory files.
- Configure the real Clerk issuer and signed `player_id` / `username` claims for social routes.
- Set `LEARNING_API_URL` to that backend. Restart the frontend/backend after pulling.
- Live question/image generation needs the backend's configured model key and generation enabled.
  The separate local Swagger demo is generation-disabled; it is not the live-game test service.
- Background jobs require a running worker. Saved-diagram assembly and learner approvals require
  their existing backend feature flags and supporting renderer/mail configuration. Disabled-feature
  responses are surfaced; the frontend does not pretend those services ran.

## Fast manual test order

1. Use two separate signed-in browser sessions/accounts. Save names; request and accept friendship.
2. Complete a private quiz. Check correct-answer coins plus participation, reload, and confirm no
   second payout. Claim an eligible quest and verify the shop/base show the same balance.
3. Buy a look or 100-coin clothing item; reload inventory and equip it. Confirm a repeated purchase
   does not deduct twice and insufficient funds leaves ownership unchanged.
4. Review cards, reload midway, and restart. The fresh pass has a new ID; the old pass remains saved.
5. Send a chat question/photo, reopen its history, and verify it appears from the other device/account
   session for the same user. Different users must not share their private learning library.
6. Select Friends mode, create a room, join with the other account, and ready both players. Start Heads-up. The guesser
   first gets the phone-to-forehead step; the explainer sees the term. Check both correct and skip,
   turn changes, results, and one participation payment per player. Spectators must not see terms.
7. Play a diagram match. Match the labelled blank IDs, tap a word then a slot, move/clear a label,
   submit an incorrect arrangement, correct it, and finish both players. Verify results and one payout.
8. Test the saved-diagram race only when its feature is enabled. Study the reference, start together,
   submit labels, forfeit another attempt, and check that forfeiting does not earn participation.
9. Check settings, activity history, queued tasks, and optional approval requests. Data deletion must
   require confirmation and must not delete the Clerk sign-in account.

## Automated evidence

Run `npm test`, `npm run typecheck`, lint and `npm run build`. Component tests cover Heads-up visibility
and Diagram tap-placement behavior. `GAME_INTEGRATION_FIXTURE` enables a separate real-FastAPI
loopback round trip with synthetic signed sessions: two players, room discovery, complete Heads-up
and Diagram rounds, outsider denial, hidden answers, results and non-duplicated participation.
The fixture is explicitly marked synthetic and is not a production backend. Real model quality,
provider credentials, hardware orientation and delivery of real approval mail are not simulated as verified.
