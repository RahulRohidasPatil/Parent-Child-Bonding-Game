import type { Room } from "./diagram-api";

/** Readiness applies to the roster captured at race creation, not later room arrivals. */
export function capturedPlayersReady(room: Room, capturedUserIds?: string[]) {
  if (!capturedUserIds)
    return (
      room.members.length >= 2 && room.members.every((member) => member.ready)
    );
  return (
    capturedUserIds.length >= 2 &&
    capturedUserIds.every((id) =>
      room.members.some((member) => member.user_id === id && member.ready),
    )
  );
}
