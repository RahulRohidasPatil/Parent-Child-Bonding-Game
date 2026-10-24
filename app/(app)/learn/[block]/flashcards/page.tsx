import { notFound } from "next/navigation";
import { FlashcardDeck } from "@/components/kay/flashcards";
import { BLOCKS, getBlock } from "@/lib/kay/content";

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ block: b.id }));
}

export const metadata = { title: "Flashcards" };

export default async function FlashcardsPage({ params }: PageProps<"/learn/[block]/flashcards">) {
  const block = getBlock((await params).block);
  if (!block) notFound();
  return <FlashcardDeck block={block} />;
}
