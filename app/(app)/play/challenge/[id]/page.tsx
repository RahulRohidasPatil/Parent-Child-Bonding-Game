import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { ChallengeScreen } from "./challenge-screen";

export const metadata: Metadata = { title: "Friend duel" };

export default function ChallengePage({ params }: PageProps<"/play/challenge/[id]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id }) => (
        <ChallengeScreen id={id} />
      ))}
    </Suspense>
  );
}
