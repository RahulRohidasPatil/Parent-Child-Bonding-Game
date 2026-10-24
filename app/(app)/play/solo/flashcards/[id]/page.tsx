import type { Metadata } from "next";
import { Suspense } from "react";
import { RouteLoading } from "@/components/qn/route-loading";
import { DeckScreen } from "./deck-screen";

export const metadata: Metadata = { title: "Solo flashcards" };

export default function FlashcardsPage({ params }: PageProps<"/play/solo/flashcards/[id]">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {params.then(({ id }) => (
        <DeckScreen id={id} />
      ))}
    </Suspense>
  );
}
