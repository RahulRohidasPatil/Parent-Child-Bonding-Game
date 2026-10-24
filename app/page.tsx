import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { KayLogo } from "@/components/kay/logo";
import { Page } from "@/components/kay/ui";
import { cn } from "@/lib/utils";

const HOW = [
  { emoji: "📅", title: "One topic a week", body: "Everyone in class learns the same subject." },
  { emoji: "📱", title: "15 minutes a day", body: "Parent and kid each practise on their own phone." },
  { emoji: "🏆", title: "Team up on Friday", body: "Parent + kid teams compete against other teams." },
];

export default function Welcome() {
  return (
    <Page
      nav={false}
      className="items-center justify-center gap-8 text-center"
      footer={
        <>
          <Link href="/onboarding" className={cn(buttonVariants({ size: "game" }), "w-full")}>
            Get started <ArrowRight />
          </Link>
          <Link href="/home" className={cn(buttonVariants({ variant: "glass", size: "game" }), "w-full")}>
            I already have an account
          </Link>
        </>
      }
    >
      <KayLogo className="animate-rise" />
      <p className="max-w-xs text-balance text-xl text-muted-foreground animate-rise [animation-delay:100ms]">
        Learn it together. <strong className="text-foreground">Win it together.</strong>
      </p>
      <ul className="flex w-full flex-col gap-2.5 text-left">
        {HOW.map((h, i) => (
          <li
            key={h.title}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3 animate-rise"
            style={{ animationDelay: `${200 + i * 100}ms` }}
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-2xl" aria-hidden>
              {h.emoji}
            </span>
            <div>
              <p className="font-heading text-lg font-semibold leading-tight">{h.title}</p>
              <p className="text-sm text-muted-foreground">{h.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
