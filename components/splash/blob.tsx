import { cn } from "@/lib/utils";
import type { Accessory, AvatarColor } from "@/lib/game/types";

export type BlobMood = "happy" | "sus" | "shock" | "sleepy";

const BODY =
  "M50 6C76 6 93 25 93 50C93 66 88 78 80 84C76 87 74 93 69 93C64 93 63 87 58 88C52 89 50 95 44 95C37 95 37 88 30 87C18 85 7 72 7 50C7 25 24 6 50 6Z";

/**
 * A "Splashie" — the drippy paint-blob characters every player plays as.
 * Colour comes from the brand tokens so avatars always match the palette.
 */
export function Blob({
  color,
  mood = "happy",
  size = 56,
  className,
  style,
  title,
  accessory = "none",
}: {
  color: AvatarColor;
  mood?: BlobMood;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  /** Avatar customisation item drawn on top of the Splashie. */
  accessory?: Accessory;
}) {
  const fill = `var(--${color})`;
  const look = mood === "sus" ? 4 : 0;
  const eyeR = mood === "shock" ? 9 : 7.5;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("shrink-0 overflow-visible", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={BODY} style={{ fill }} />
      {/* soft inner shading + shine */}
      <path d={BODY} fill="black" opacity="0.12" transform="translate(4 5) scale(0.92)" style={{ mixBlendMode: "multiply" }} />
      <path d={BODY} style={{ fill }} transform="translate(3 2) scale(0.9)" />
      <ellipse cx="30" cy="26" rx="9" ry="5" fill="white" opacity="0.45" transform="rotate(-30 30 26)" />

      {/* eyes */}
      {[36, 64].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="46" rx={eyeR} ry={eyeR + 1.5} fill="white" />
          <circle cx={cx + look} cy={mood === "sleepy" ? 49 : 47} r={mood === "shock" ? 3 : 3.8} fill="var(--ink)" />
          {(mood === "sus" || mood === "sleepy") && (
            <rect
              x={cx - eyeR - 1}
              y={46 - eyeR - 3}
              width={eyeR * 2 + 2}
              height={eyeR + (mood === "sleepy" ? 4 : 2)}
              style={{ fill }}
              transform={mood === "sus" ? `rotate(${cx < 50 ? 8 : -8} ${cx} 46)` : undefined}
            />
          )}
        </g>
      ))}

      {/* mouth */}
      {mood === "happy" && (
        <path d="M40 62Q50 72 60 62" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
      )}
      {mood === "sus" && (
        <path d="M42 65Q52 61 60 64" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
      )}
      {mood === "shock" && <ellipse cx="50" cy="66" rx="5" ry="6.5" fill="var(--ink)" />}
      {mood === "sleepy" && (
        <path d="M44 64Q50 67 56 64" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      )}

      {/* cheeks */}
      {mood !== "shock" && (
        <>
          <ellipse cx="24" cy="58" rx="5" ry="3" fill="white" opacity="0.25" />
          <ellipse cx="76" cy="58" rx="5" ry="3" fill="white" opacity="0.25" />
        </>
      )}
      <AccessoryLayer accessory={accessory} />
    </svg>
  );
}

function AccessoryLayer({ accessory }: { accessory: Accessory }) {
  const line = { stroke: "var(--ink)", strokeWidth: 2.5, strokeLinejoin: "round" as const };
  switch (accessory) {
    case "crown":
      return <path d="M30 16L32 -4L42 6L50 -10L58 6L68 -4L70 16Z" fill="var(--sun)" {...line} />;
    case "cap":
      return (
        <g {...line}>
          <path d="M22 22Q50 -10 78 22Z" fill="var(--coral)" />
          <path d="M62 19Q82 13 96 22Q80 27 62 24Z" fill="var(--coral)" />
          <circle cx="50" cy="5" r="3" fill="var(--sun)" />
        </g>
      );
    case "party":
      return (
        <g {...line}>
          <path d="M36 16L54 -20L68 14Z" fill="var(--pink)" />
          <path d="M42 4L62 0M47 -6L58 -9" fill="none" stroke="white" strokeWidth="3" />
          <circle cx="54" cy="-20" r="5" fill="var(--sun)" />
        </g>
      );
    case "glasses":
      return (
        <g fill="white" fillOpacity="0.18" stroke="var(--ink)" strokeWidth="3.5">
          <circle cx="35" cy="46" r="12" />
          <circle cx="65" cy="46" r="12" />
          <path d="M47 45Q50 42 53 45" fill="none" />
        </g>
      );
    case "astronaut":
      return (
        <g>
          <circle cx="50" cy="50" r="51" fill="var(--sky)" fillOpacity="0.16" stroke="white" strokeOpacity="0.85" strokeWidth="4" />
          <path d="M20 30Q28 12 46 8" fill="none" stroke="white" strokeOpacity="0.8" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M12 46Q12 -2 50 -2Q88 -2 88 46" fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
          <rect x="4" y="36" width="14" height="24" rx="6" fill="var(--coral)" {...line} />
          <rect x="82" y="36" width="14" height="24" rx="6" fill="var(--coral)" {...line} />
        </g>
      );
    default:
      return null;
  }
}
