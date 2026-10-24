import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { QuizScreen } from "./quiz-screen";

export const metadata: Metadata = { title: "Solo quiz" };

export default function QuizPage({ params }: PageProps<"/play/solo/quiz/[id]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id }) => (
        <QuizScreen id={id} />
      ))}
    </Suspense>
  );
}
