const COLORS = ["var(--sun)", "var(--coral)", "var(--mint)", "var(--sky)", "var(--grape)", "var(--pink)"];

/** Lightweight CSS confetti burst. Decorative only. */
export function Confetti({ pieces = 28 }: { pieces?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {Array.from({ length: pieces }, (_, i) => {
        // deterministic scatter so render stays pure
        const left = (i * 37) % 100;
        const delay = ((i * 53) % 900) / 1000;
        const size = 8 + ((i * 7) % 8);
        return (
          <span
            key={i}
            className="absolute -top-6 block animate-confetti rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 1.6,
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              borderRadius: i % 3 === 0 ? "9999px" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
