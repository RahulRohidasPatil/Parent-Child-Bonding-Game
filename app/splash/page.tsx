import Link from "next/link";
import { DoorOpen, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { HowToPlay } from "@/components/splash/how-to-play";
import { Logo } from "@/components/splash/logo";
import { Screen } from "@/components/splash/screen";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <Screen
      className="items-center justify-center gap-8 text-center"
      footer={
        <>
          <Link href="/splash/host" className={cn(buttonVariants({ variant: "sun", size: "game" }), "w-full")}>
            <Sparkles /> Host a game
          </Link>
          <Link href="/splash/join" className={cn(buttonVariants({ variant: "glass", size: "game" }), "w-full")}>
            <DoorOpen /> Join with a code
          </Link>
          <div className="flex justify-center">
            <HowToPlay />
          </div>
        </>
      }
    >
      <Logo className="animate-rise" />
      <p className="max-w-xs text-balance text-lg text-muted-foreground animate-rise [animation-delay:120ms]">
        One secret word. One sneaky imposter. <span className="text-foreground">The whole family</span> trying
        to figure out who.
      </p>
      <ul className="flex flex-wrap justify-center gap-2 text-sm font-bold animate-rise [animation-delay:240ms]">
        {["👨‍👩‍👧 3–8 players", "📱 One phone each", "⏱️ 5-min rounds"].map((t) => (
          <li key={t} className="rounded-full bg-white/6 px-3 py-1.5">
            {t}
          </li>
        ))}
      </ul>
    </Screen>
  );
}
