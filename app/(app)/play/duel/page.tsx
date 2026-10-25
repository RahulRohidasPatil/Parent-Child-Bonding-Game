import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { McqScreen } from "./mcq-screen";

export const metadata: Metadata = { title: "MCQ quiz" };

export default function DuelPage() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <McqScreen />
    </Suspense>
  );
}
