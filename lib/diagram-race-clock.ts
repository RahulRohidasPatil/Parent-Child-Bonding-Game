export type RaceTiming = { startedAt: number; deadlineAt: number };

/** Calculate from timestamps rather than counting interval callbacks. */
export function getRaceClock(timing: RaceTiming, now: number) {
  return {
    started: now >= timing.startedAt,
    expired: now >= timing.deadlineAt,
    countdownSeconds: Math.max(0, Math.ceil((timing.startedAt - now) / 1000)),
    remainingSeconds: Math.max(
      0,
      Math.ceil((timing.deadlineAt - Math.max(now, timing.startedAt)) / 1000),
    ),
  };
}

export function formatRaceTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)
    .toString()
    .padStart(2, "0")}:${(whole % 60).toString().padStart(2, "0")}`;
}
