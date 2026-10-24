import Link from "next/link";
import { notFound } from "next/navigation";
import { Layers, ListChecks } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ExplainerPlayer } from "@/components/kay/explainer-player";
import { ReadAloudButton } from "@/components/kay/read-aloud";
import { Tutor } from "@/components/kay/tutor";
import { Eyebrow, Page } from "@/components/kay/ui";
import { BLOCKS, getBlock } from "@/lib/kay/content";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ block: b.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[block]">) {
  const { block } = await params;
  return { title: getBlock(block)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: PageProps<"/learn/[block]">) {
  const { block: id } = await params;
  const block = getBlock(id);
  if (!block) notFound();
  const lessonText = block.sections.map((s) => `${s.heading}. ${s.body}`).join(" ");

  return (
    <Page
      back="/learn"
      title={
        <span className="flex items-center gap-2">
          <span aria-hidden>{block.emoji}</span> {block.title}
        </span>
      }
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/learn/${block.id}/flashcards`} className={cn(buttonVariants({ variant: "glass", size: "game" }), "px-3")}>
            <Layers /> Flashcards
          </Link>
          <Link href={`/learn/${block.id}/quiz`} className={cn(buttonVariants({ size: "game" }), "px-3")}>
            <ListChecks /> Quiz
          </Link>
        </div>
      }
    >
      <ExplainerPlayer block={block} />

      <article className="flex flex-col gap-4" aria-labelledby="lesson-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Eyebrow>{block.minutes} min read · free, no activity used</Eyebrow>
            <h2 id="lesson-title" className="font-heading text-2xl font-semibold">
              The lesson
            </h2>
          </div>
          <ReadAloudButton text={lessonText} />
        </div>
        {block.sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h3 className="font-heading text-lg font-semibold">{s.heading}</h3>
            <p className="text-lg leading-relaxed">{s.body}</p>
          </section>
        ))}
      </article>

      <Tutor block={block} />
    </Page>
  );
}
