import type { LearningBlock } from "@/lib/kay/content";

/**
 * Placeholder for the AI-assembled pixel-art explainer (plan §4). The real
 * version composes scenes from the team's 2D pixel-asset library; this one
 * draws a few hand-made scenes so the player UI can be designed and tested.
 */

const W = 320;
const H = 180;

/** A pixelated disc built from horizontal runs (few rects, crisp edges). */
function PixelDisc({ cx, cy, r, u = 4, fill }: { cx: number; cy: number; r: number; u?: number; fill: string }) {
  const rows = [];
  for (let y = -r; y < r; y += u) {
    const yc = y + u / 2;
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - yc * yc)) / u) * u;
    if (half <= 0) continue;
    rows.push(<rect key={y} x={cx - half} y={cy + y} width={half * 2} height={u} fill={fill} />);
  }
  return <g>{rows}</g>;
}

const STARS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 73) % W,
  y: (i * 41 + 7) % H,
  d: (i % 5) * 0.4,
}));

function Starfield() {
  return (
    <g>
      {STARS.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={i % 4 === 0 ? 4 : 2}
          height={i % 4 === 0 ? 4 : 2}
          fill="white"
          style={{ animation: `kay-twinkle 2.4s ${s.d}s ease-in-out infinite` }}
        />
      ))}
    </g>
  );
}

/** Rotate around `origin`; `phase` (0–1) starts the orbit part-way round. */
const spin = (seconds: number, origin: string, reverse = false, phase = 0): React.CSSProperties => ({
  transformOrigin: origin,
  transformBox: "view-box",
  animation: `${reverse ? "kay-spin-rev" : "kay-spin"} ${seconds}s linear ${-phase * seconds}s infinite`,
});

const PLANETS = [
  { r: 26, size: 3, color: "#c9b8a6", t: 4 },
  { r: 34, size: 4, color: "#f2c46d", t: 6 },
  { r: 43, size: 4, color: "#5aa9e6", t: 8 },
  { r: 51, size: 3, color: "#e0714f", t: 11 },
  { r: 63, size: 9, color: "#e8b07a", t: 16 },
  { r: 74, size: 7, color: "#f3d98b", t: 21 },
  { r: 83, size: 5, color: "#9fe0e6", t: 27 },
  { r: 90, size: 5, color: "#5b7cf0", t: 33 },
];

export function PixelScene({ scene, playing }: { scene: LearningBlock["scene"]; playing: boolean }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block h-auto w-full"
      shapeRendering="crispEdges"
      aria-hidden
      data-paused={playing ? undefined : ""}
    >
      <rect width={W} height={H} fill="#140d2a" />
      <g className="kay-scene">
        <Starfield />
        {scene === "sun" && (
          <>
            <PixelDisc cx={90} cy={90} r={62} u={6} fill="#f08a3c" />
            <PixelDisc cx={90} cy={90} r={54} u={6} fill="#ffd25a" />
            <PixelDisc cx={78} cy={76} r={18} u={6} fill="#fff1a8" />
            <line
              x1={156}
              y1={90}
              x2={256}
              y2={90}
              stroke="#ffd25a"
              strokeWidth={4}
              strokeDasharray="12 12"
              style={{ animation: "kay-beam 1s linear infinite" }}
            />
            <PixelDisc cx={272} cy={90} r={10} u={2} fill="#5aa9e6" />
            <rect x={266} y={84} width={6} height={4} fill="#6fd08c" />
            <rect x={272} y={92} width={6} height={4} fill="#6fd08c" />
          </>
        )}

        {scene === "system" && (
          <>
            {PLANETS.map((p) => (
              <circle key={p.r} cx={160} cy={90} r={p.r} fill="none" stroke="white" strokeOpacity={0.12} strokeDasharray="2 4" shapeRendering="auto" />
            ))}
            <PixelDisc cx={160} cy={90} r={16} u={4} fill="#ffd25a" />
            {PLANETS.map((p, i) => (
              <g key={p.r} style={spin(p.t, "160px 90px", false, (i * 0.37) % 1)}>
                <PixelDisc cx={160 + p.r} cy={90} r={p.size} u={p.size > 5 ? 3 : 2} fill={p.color} />
                {p.r === 74 && <rect x={160 + p.r - 11} y={89} width={22} height={2} fill="#f3d98b" opacity={0.8} />}
              </g>
            ))}
          </>
        )}

        {scene === "earth-moon" && (
          <>
            {/* sunlight from the left */}
            {[40, 70, 100, 130].map((y) => (
              <rect key={y} x={0} y={y} width={36} height={3} fill="#ffd25a" opacity={0.6} />
            ))}
            <PixelDisc cx={170} cy={90} r={30} u={4} fill="#5aa9e6" />
            <rect x={150} y={74} width={16} height={12} fill="#6fd08c" />
            <rect x={176} y={96} width={14} height={10} fill="#6fd08c" />
            <circle cx={170} cy={90} r={68} fill="none" stroke="white" strokeOpacity={0.15} strokeDasharray="2 4" shapeRendering="auto" />
            <g style={spin(12, "170px 90px")}>
              {/* counter-rotate so the lit side always faces the Sun (left) */}
              <g style={spin(12, "238px 90px", true)}>
                <PixelDisc cx={238} cy={90} r={12} u={2} fill="#4a4566" />
                <clipPath id="moon-lit">
                  <rect x={222} y={74} width={16} height={32} />
                </clipPath>
                <g clipPath="url(#moon-lit)">
                  <PixelDisc cx={238} cy={90} r={12} u={2} fill="#ece6d4" />
                </g>
              </g>
            </g>
          </>
        )}

        {scene === "gravity" && (
          <>
            <rect x={0} y={150} width={180} height={30} fill="#3f8f4f" />
            <rect x={56} y={80} width={14} height={70} fill="#7a4a2a" />
            <PixelDisc cx={63} cy={66} r={36} u={4} fill="#4fb062" />
            <g style={{ ["--fall" as string]: "62px", animation: "kay-fall 3s ease-in infinite" }}>
              <PixelDisc cx={84} cy={82} r={6} u={2} fill="#e5483a" />
              <rect x={83} y={74} width={2} height={4} fill="#7a4a2a" />
            </g>
            <PixelDisc cx={252} cy={70} r={16} u={4} fill="#ffd25a" />
            <circle cx={252} cy={70} r={46} fill="none" stroke="white" strokeOpacity={0.18} strokeDasharray="2 4" shapeRendering="auto" />
            <g style={spin(8, "252px 70px")}>
              <PixelDisc cx={298} cy={70} r={6} u={2} fill="#5aa9e6" />
              <line x1={290} y1={70} x2={272} y2={70} stroke="white" strokeWidth={2} strokeOpacity={0.7} />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
