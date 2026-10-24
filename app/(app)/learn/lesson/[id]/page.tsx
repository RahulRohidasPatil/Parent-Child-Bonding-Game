import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { LessonScreen } from "./lesson-screen";

export const metadata: Metadata = { title: "Lesson" };

export default function LessonPage({ params }: PageProps<"/learn/lesson/[id]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id }) => (
        <LessonScreen id={id} />
      ))}
    </Suspense>
  );
}
