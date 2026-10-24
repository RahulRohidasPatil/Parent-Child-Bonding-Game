import { cn } from "@/lib/utils";
import type { AvatarId } from "@/lib/qn-data";

/*
 * Avatar sprites are 128×128 pixel art (figure spans roughly x 45–83, y 2–123), from the
 * DIFF character builder hand-off. Plain <img> keeps them crisp with image-rendering: pixelated.
 */

export function Sprite({
  id,
  size = 256,
  alt = "",
  flip,
  className,
  style,
}: {
  id: AvatarId | "cat";
  size?: number;
  alt?: string;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/qn/avatars/${id}.png`}
      alt={alt}
      width={size}
      height={id === "cat" ? Math.round((size * 30) / 28) : size}
      className={cn("pixelated select-none", className)}
      style={{ ...(flip ? { transform: "scaleX(-1)" } : null), ...style }}
      draggable={false}
    />
  );
}

/** Round head-and-shoulders crop of an avatar sprite. */
export function Face({
  id,
  size = 40,
  tint = "#cdeff5",
  ring,
  alt = "",
  className,
}: {
  id: AvatarId;
  size?: number;
  tint?: string;
  ring?: string;
  alt?: string;
  className?: string;
}) {
  const k = size / 40;
  return (
    <span
      className={cn("relative block shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, background: tint, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/qn/avatars/${id}.png`}
        alt=""
        className="pixelated absolute max-w-none"
        style={{ width: 128 * k, height: 128 * k, left: -44 * k, top: 0 }}
        draggable={false}
      />
    </span>
  );
}

/** Sky-blue stage with a floor shadow, as used behind avatars across the app. */
export function Stage({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative overflow-hidden rounded-[28px] bg-stage", className)}>{children}</div>;
}
