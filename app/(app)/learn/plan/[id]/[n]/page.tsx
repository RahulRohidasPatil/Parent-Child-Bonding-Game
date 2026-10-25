import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { SubtopicLesson } from "./subtopic-lesson";

export const metadata: Metadata = { title: "Study plan" };

export default function SubtopicPage({ params }: PageProps<"/learn/plan/[id]/[n]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id, n }) => (
        <SubtopicLesson planId={id} index={Number(n)} />
      ))}
    </Suspense>
  );
}
