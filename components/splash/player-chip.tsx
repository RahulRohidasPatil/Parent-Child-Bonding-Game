import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/game/types";
import { Blob, type BlobMood } from "./blob";

export function RoleTag({ role }: { role: Player["role"] }) {
  return (
    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
      {role === "kid" ? "Kid" : "Grown-up"}
    </span>
  );
}

/** Row-style player entry used in the lobby, clue log and scoreboard. */
export function PlayerChip({
  player,
  isMe,
  mood,
  trailing,
  className,
}: {
  player: Player;
  isMe?: boolean;
  mood?: BlobMood;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-2.5 pr-4",
        isMe && "border-sun/50 bg-sun/8",
        className,
      )}
    >
      <Blob color={player.color} mood={mood} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-heading text-lg font-semibold leading-tight">{player.name}</span>
          {player.isHost && <Crown className="size-4 shrink-0 text-sun" aria-label="Host" />}
          {isMe && <span className="text-xs font-bold text-sun">(you)</span>}
        </div>
        <RoleTag role={player.role} />
      </div>
      {trailing}
    </div>
  );
}
