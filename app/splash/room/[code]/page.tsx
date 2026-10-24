import { Suspense } from "react";
import { GameRoom, RoomLoading } from "@/components/game/game-room";

export default function RoomPage({ params }: PageProps<"/splash/room/[code]">) {
  return (
    <Suspense fallback={<RoomLoading />}>
      {params.then(({ code }) => (
        <GameRoom code={code.toUpperCase()} />
      ))}
    </Suspense>
  );
}
