import { notFound } from "next/navigation";
import { Quiz } from "@/components/kay/quiz";
import { BLOCKS, getBlock } from "@/lib/kay/content";

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ block: b.id }));
}

export const metadata = { title: "Quiz" };

export default async function QuizPage({ params }: PageProps<"/learn/[block]/quiz">) {
  const block = getBlock((await params).block);
  if (!block) notFound();
  return <Quiz block={block} />;
}
