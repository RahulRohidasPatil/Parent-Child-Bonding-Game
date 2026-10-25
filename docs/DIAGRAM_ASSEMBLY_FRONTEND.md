# Diagram Assembly frontend

The game at /play/diagram-assembly uses saved backend resources, private rooms, and server-scored races. The setup screen offers hosting and joining by the returned eight-character room code. A host chooses a lesson and one of its saved diagram visuals. Draft lessons require an explicit review confirmation and the current revision before approval.

Backend contracts and deployment prerequisites remain in the [backend diagram guide](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/7664eb2d195dd4dbd5b136894aeb1058f25d5331/docs/DIAGRAM_ASSEMBLY.md) and [lifecycle supplement](https://github.com/Vl4dC/Parent-Child-Bonding-Game-Backend/blob/7664eb2d195dd4dbd5b136894aeb1058f25d5331/docs/DIAGRAM_LIFECYCLE_READINESS.md). This repository does not apply backend migrations or enable the renderer.

## Identity and forwarding

Both same-origin learning proxy routes retain the app's sign-in guard and use lib/server/player-id.ts for player selection. Existing UUID account IDs are preserved. Opaque account IDs, including Clerk user IDs, map deterministically to a UUIDv5 using a fixed namespace and the immutable account ID. This mapping must remain stable across deployments. /api/auth/me exposes this UUID as playerId while keeping id as the original authentication ID. Diagram Assembly uses playerId for requests, room membership, host checks, and room resumption.

An explicit UUID selector is forwarded as before. Old clients sending their own raw authentication ID are normalized to their account's player UUID; unrelated malformed selectors are rejected. Neither proxy omits the player header for Clerk accounts. The primary proxy also forwards Idempotency-Key, JSON, PUT, status, and Retry-After.

Learning, room, and race calls must select the same UUID. Separate accounts naturally supply different player IDs. Two phones selecting the same UUID are one participant. The backend header is a selector, not backend authentication or verified family/account isolation.

Earlier lessons written without a player header belong to the backend's shared default partition. They are not silently reassigned or copied into individual player partitions by this integration. A deployment migrating existing data needs a separate reviewed migration plan.

Set LEARNING_API_URL to the combined backend service's base URL, without /api. The backend must be reachable and its Diagram Assembly feature and renderer must be ready. A disabled feature or unavailable runtime is shown as an API error; there is no local-game fallback.

## Interaction and lifecycle

- Prepare the selected saved diagram, then create or join the private room.
- Create a round after 2–8 participants join. Later joiners wait for another round.
- Study the server's frozen labelled SVG, use room readiness, then let the creating host start.
- The countdown and deadline use server timestamps plus a monotonic browser clock between snapshots.
- Render the supplied SVG as an image and position controls from its exact viewBox and slot coordinates. No Mermaid redraw, source hints, or answer map enter the play board.
- Mouse drag/drop, tap-to-select, and native keyboard slot selectors all change opaque card IDs. Equal-text cards remain distinct.
- Save full placement mappings through a single serialized writer, debounced after drops and capped at one write per second. Finish flushes pending placements first.
- Room, race, and player versions are independent. An uncertain write keeps its request key and body. Conflicts and historical receipts reload current player state before further writes.
- Poll lightweight room/race snapshots every three seconds, six seconds for terminal rounds, and fifteen seconds in a hidden tab, with error/rate-limit backoff. SVG bodies load only when needed. This leaves room under the default 120-request budget for normal placement saves and commands.
- Finishing or forfeiting ends only the caller's attempt. Results and review wait for the backend's terminal state. No local score, winner, rank, elapsed time, coins, or mastery is invented.
- Session storage restores the room after a reload. Disconnecting or leaving does not pause the race; resumption depends on retained backend membership, participation, and deadline.
- Source changes hide study/play/review. Saved terminal summaries remain readable. Current-host management can cancel an abandoned round without granting participant access.

Readiness is currently room-scoped and may carry into another round. The frontend does not invent a per-round readiness endpoint.

## Verification

For live acceptance, use two distinct player accounts on separate devices against a reachable, enabled backend: create/join; create a round; mark both ready; start; submit a wrong reconstruction and correct it; finish both attempts; compare server rankings and review; replay; reload/resume; forfeit; cancel an active round; verify that a late joiner cannot play an already-created round. Repeat with four and eight clients on staging. These checks require the deployed backend.
