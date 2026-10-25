import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { NewChallenge } from "./new-challenge";

export const metadata: Metadata = { title: "Challenge a friend" };

export default function NewChallengePage() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <NewChallenge />
    </Suspense>
  );
}
