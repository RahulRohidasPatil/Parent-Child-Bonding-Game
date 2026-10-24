import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { DuelScreen } from "./duel-screen";

export const metadata: Metadata = { title: "Family duel" };

export default function DuelPage() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <DuelScreen />
    </Suspense>
  );
}
