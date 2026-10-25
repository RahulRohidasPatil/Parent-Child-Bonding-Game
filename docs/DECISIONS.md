# Frontend decisions and tradeoffs

These records explain the reviewed implementation, not an invented history of team discussions. **Recorded** means a source instruction, configuration or commit explicitly expresses the choice. **Inferred** means the rationale follows from the implementation and should be confirmed before being presented as the team's original intent. Snapshot: `67b663f`, 25 October 2026.

## F1. Separate the web application and backend repositories

**Status: recorded.** `AGENTS.md` defines the repository boundary; backend implementation belongs in the separate FastAPI repository.

**Choice.** Keep presentation, browser assets and product requirements here. Keep Python models, persistence, backend tests and contracts there. Next.js route handlers provide the integration boundary.

**Justification.** The UI and Python learning engines have different runtimes and responsibilities. Separate ownership allows frontend work without duplicating database or gameplay rules, while backend clients can reuse the same APIs.

**Tradeoff.** A feature can require coordinated changes and compatible releases in two repositories. A green build in one repository does not prove the pair works together. Keep the proxy clients and backend contracts aligned; test with the exact counterpart revision.

**Revisit when** coordinated changes routinely become blocked by release ordering. A shared contract artifact may solve that before moving both repositories.

## F2. Use a same-origin Next.js proxy

**Status: implemented; rationale inferred.** Evidence: `app/api/` and `lib/server/learning-session.ts`.

**Choice.** Browser clients call `/api/*`; Next.js adds identity context and forwards allowlisted operations to FastAPI.

**Justification.** Screens do not need a deployment-specific backend origin or server credentials. Identity forwarding and upstream failures have one implementation. Browser-to-backend CORS is unnecessary for these proxied requests.

**Tradeoff.** Every call has another hop, upload/time limits must work through both servers, and allowlists must be updated for new routes. The proxy does not secure a legacy FastAPI endpoint if that endpoint is independently reachable.

**Revisit when** streaming/latency or large uploads make this hop expensive; preserve a verified identity contract before considering direct browser access.

## F3. Delegate account authentication to Clerk

**Status: recorded implementation choice.** Evidence: root provider, `proxy.ts`, auth forms and social setup.

**Choice.** Clerk handles signup, credentials, verification and sessions; the application links each account to a stable learning UUID.

**Justification.** The app can concentrate on learning and gameplay while an identity provider handles the account lifecycle. Keeping a player UUID avoids rewriting existing partitioned learning/home records around provider IDs.

**Tradeoff.** Sign-in and first-use metadata depend on Clerk availability and correct token configuration. There are two IDs to understand. The per-process first-use promise prevents duplicate local allocation, but is not a distributed identity-provisioning transaction. Metadata role/age values are not verified guardianship or age evidence.

**Revisit when** provisioning must be strongly consistent across multiple frontend instances or a different identity provider is required. See [SESSION.md](SESSION.md).

## F4. Use a small browser store as cache and local continuity

**Status: implemented; rationale inferred.** Evidence: `lib/store.ts`, wallet, library and settings clients.

**Choice.** React's external-store interface and local storage hold app-wide view state and device-only features. Connected domain data is refreshed from the backend.

**Justification.** This gives lightweight sharing between the shell and screens without introducing another state-management dependency. Account keys reduce accidental mixing on shared devices, and cached values support responsive navigation.

**Tradeoff.** Legacy fields make canonical ownership easy to misunderstand. Local plans/streaks do not automatically follow a learner to another device. Browser storage is best-effort, and some preference/date keys remain device-wide. Account-switch guards must be applied to asynchronous updates.

**Revisit when** cache invalidation, race handling or offline requirements grow complex enough to justify a dedicated query cache and explicit persisted-state migrations.

## F5. Poll for live state and let the server own time

**Status: implemented; rationale inferred.** Evidence: presence, room/match screens and `use-live-home.ts`.

**Choice.** Use snapshots and HTTP polling for presence, rooms, matches and home synchronization. Animate the UI timer between server snapshots.

**Justification.** The frontend can reconnect using the same read APIs and does not require a second transport to work. Server timing avoids letting a paused or manipulated browser decide whether an answer is timely.

**Tradeoff.** Updates can lag by a poll interval and background traffic consumes rate/connection budgets. Multiple open screens or tabs can increase load. Polling cannot offer the latency of a well-designed push transport.

**Revisit when** measured room size or latency demands justify SSE/WebSockets/Realtime. Retain authoritative snapshots and reconnect behavior even with push.

## F6. Isolate generated HTML in sandboxed frames

**Status: implemented; rationale inferred.** Evidence: `components/qn/visual-frame.tsx` and backend rendering harness.

**Choice.** Render generated visual documents in `srcDoc` frames with script permission but without same-origin permission.

**Justification.** Diagrams, charts and interactive explanations can share one rendering interface without inserting generated scripts into the application DOM. Bounded source-checked height messages support responsive layouts.

**Tradeoff.** Frames introduce their own focus, sizing and accessibility work. Sandbox and validation checks are not a correctness guarantee; a diagram can be drawable and still misleading.

**Revisit when** a visual class needs a native accessible component or the generated-code trust model changes. Do not remove isolation merely to simplify styling.

## F7. Offer one responsive web experience and Home Screen installation

**Status: recorded implementation choice.** Evidence: `AppShell`, manifest and launch commit `72ab9fe`.

**Choice.** Use mobile tabs, a tablet rail and a desktop sidebar over the same application, with a standalone manifest and dedicated icons.

**Justification.** Learning alone, showing a phone in Heads-up and managing a base require different screen sizes. A web experience reduces the need to maintain separate clients; Home Screen launch improves repeat access.

**Tradeoff.** Browser capabilities vary, the experience needs internet, and installation does not provide native distribution or offline sync. Heads-up uses buttons rather than hardware tilt detection.

**Revisit when** verified usage requires native device APIs, dependable offline lessons or store distribution.

## F8. Keep the launch interface light-only

**Status: recorded.** Commit `67b663f` removes dark mode and its anonymous-login redirect loop; root layout forces a light color scheme.

**Choice.** Retain text size, contrast and motion settings while removing dark-mode selection from this launch revision.

**Justification.** The documented immediate reason is correcting the launch behavior. One supported palette also reduces the combinations to validate during launch; that second benefit is inferred rather than a measured result.

**Tradeoff.** Users who prefer a dark palette lack that choice. The backend still accepts a theme field, so API capability must not be mistaken for current UI capability.

**Revisit when** dark mode can be introduced with verified signed-out/signed-in routing, persistence and contrast checks.

## F9. Display backend outcomes for money-like game state

**Status: implemented; rationale inferred.** Evidence: `economy-api.ts`, `wallet-api.ts` and results screens.

**Choice.** Request claims or purchases and replace the local cache with the server balance. Never trust a browser-calculated award as a wallet mutation.

**Justification.** Reloads, multiple tabs and retries should converge on one ledger. The same balance can pay for base changes and shop items without browser arithmetic becoming the accounting system.

**Tradeoff.** Actions require connectivity and clear handling for conflicts/insufficient funds. This correctness property is scoped to backend rules; unverified legacy player selectors still limit privacy and access control.

**Revisit when** the product adds trading, refunds, real-money transactions or stronger account-level authorization. Those features require new contracts, not local balance patches.
