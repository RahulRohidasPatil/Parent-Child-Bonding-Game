/** Equal-text cards still have separate IDs. */
export function moveCard(
  placements: Record<string, string>,
  slotId: string,
  cardId: string | null,
) {
  const next = { ...placements };
  delete next[slotId];
  if (cardId !== null) {
    for (const id of Object.keys(next))
      if (next[id] === cardId) delete next[id];
    next[slotId] = cardId;
  }
  return next;
}
export function parseViewBox(
  value: string,
): [number, number, number, number] | null {
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return parts.length === 4 &&
    parts.every(Number.isFinite) &&
    parts[2] > 0 &&
    parts[3] > 0
    ? (parts as [number, number, number, number])
    : null;
}
