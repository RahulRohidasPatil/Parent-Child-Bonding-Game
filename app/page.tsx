import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Camera, Check, Layers, ShieldCheck, Swords, TimerOff, Users } from "lucide-react";
import { Logo } from "@/components/qn/brand";
import { Face, Sprite } from "@/components/qn/sprite";
import { buttonVariants } from "@/components/ui/button";
import { PARTY_GAMES, SUBJECTS } from "@/lib/qn-data";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: Camera, tint: "bg-brand-soft text-brand", ink: "text-brand-ink", title: "Scan your notes", body: "Snap pages or upload a PDF. QuestNest finds the topics, chapters and pages to study." },
  { icon: Layers, tint: "bg-sky-soft text-sky-ink", ink: "text-sky-ink", title: "Study your way", body: "Get a lesson pitched at your age, with diagrams, flashcards and a quiz built from your own pages." },
  { icon: Swords, tint: "bg-rose text-rose-ink", ink: "text-rose-ink", title: "Play together", body: "Duel Mom or Dad on one phone, or play party games with friends. Earn coins for your base." },
];

const PARENT = [
  { icon: ShieldCheck, text: "Approve accounts for kids under 16 by email" },
  { icon: Check, text: "Lessons from your book use only what those pages say" },
  { icon: Users, text: "Approve every new friend before visits" },
  { icon: TimerOff, text: "No timers unless your family turns them on" },
];

const cta = cn(buttonVariants({ variant: "brand", size: "cta" }));
const ghost = cn(buttonVariants({ variant: "soft", size: "cta" }), "border-white");

export default function Landing() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------- header ---------- */}
      <header className="bg-stage">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3.5 md:px-10 xl:px-6">
          <Logo className="mr-auto" />
          <nav aria-label="Sections" className="hidden items-center gap-6 text-base font-extrabold text-[#33505b] lg:flex">
            <a href="#how" className="py-2 hover:text-foreground">How it works</a>
            <a href="#base" className="py-2 hover:text-foreground">Your base</a>
            <a href="#games" className="py-2 hover:text-foreground">Games</a>
            <a href="#parents" className="py-2 hover:text-foreground">For parents</a>
          </nav>
          <div className="flex gap-2.5">
            <Link href="/login" className={cn(buttonVariants({ variant: "soft", size: "pill" }), "border-white")}>Log in</Link>
            <Link href="/register" className={cn(buttonVariants({ variant: "brand", size: "pill" }), "hidden sm:inline-flex")}>Get started</Link>
          </div>
        </div>
      </header>

      <main id="content">
        {/* ---------- hero ---------- */}
        <section className="overflow-hidden rounded-b-[32px] bg-stage md:rounded-b-[44px]">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pt-3 md:px-10 md:pt-8 lg:flex-row lg:items-center xl:px-6">
            <div className="flex flex-col gap-3 lg:flex-1 lg:pb-12">
              <span className="text-[13px] font-black tracking-[.06em] text-brand-dark">FOR KIDS 10–18 AND THEIR FAMILIES</span>
              <h1 className="text-[36px] leading-[1.06] font-black md:text-[50px] xl:text-[60px]">Turn schoolwork into family game night.</h1>
              <p className="max-w-[520px] text-base font-bold text-[#3f6470] md:text-lg">
                Snap your notes, get a study plan, then duel Mom and Dad. Earn coins to grow your own base.
              </p>
              <div className="mt-2 hidden flex-wrap gap-3 md:flex">
                <Link href="/register" className={cta}>Create an account</Link>
                <Link href="/login" className={ghost}>Log in</Link>
              </div>
            </div>

            {/* family art */}
            <div className="relative mx-auto h-[262px] w-[350px] shrink-0 md:h-[380px] md:w-[520px] lg:mx-0 lg:h-[470px] lg:w-[540px]" aria-hidden="true">
              <div className="absolute bottom-3 left-1/2 h-6 w-[270px] -translate-x-1/2 rounded-[50%] bg-stage-floor md:h-9 md:w-[420px]" />
              <Sprite id="mom" className="absolute bottom-3 left-1/2 w-[256px] -translate-x-[78%] md:w-[372px]" />
              <Sprite id="dad" className="absolute bottom-3 left-1/2 w-[256px] -translate-x-[22%] md:w-[372px]" />
              <Sprite id="nova" className="absolute bottom-0 left-1/2 w-[256px] -translate-x-1/2 md:w-[372px]" />
              <Sprite id="cat" className="absolute bottom-3 left-[calc(50%+128px)] w-14 md:left-[calc(50%+180px)] md:w-20" />
              <div className="absolute top-2 right-0 hidden w-[200px] rounded-[18px_18px_4px_18px] bg-card px-4 py-3 text-base leading-snug font-extrabold md:block">
                Duel tonight at 7? Loser makes popcorn.
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pb-5 md:hidden">
              <Link href="/register" className={cta}>Create an account</Link>
              <Link href="/login" className={ghost}>I already have one</Link>
            </div>
          </div>
        </section>

        {/* ---------- how it works ---------- */}
        <section id="how" className="mx-auto flex w-full max-w-[1200px] scroll-mt-6 flex-col gap-3.5 px-4 pt-10 md:px-10 md:pt-16 xl:px-6">
          <span className="text-[13px] font-black tracking-[.06em] text-brand-ink">HOW IT WORKS</span>
          <h2 className="text-[26px] leading-tight font-black md:text-[34px]">From notebook to game night in three steps</h2>
          <ol className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2.5 rounded-3xl border border-line bg-card p-5">
                <span className="flex items-center gap-3">
                  <span className={cn("flex size-12 items-center justify-center rounded-2xl", s.tint)}>
                    <s.icon className="size-6" strokeWidth={2.2} />
                  </span>
                  <span className={cn("text-[13px] font-black tracking-[.04em]", s.ink)}>STEP {i + 1}</span>
                </span>
                <span className="text-[19px] font-black">{s.title}</span>
                <span className="text-[15px] leading-relaxed font-bold text-muted-foreground">{s.body}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- base ---------- */}
        <section id="base" className="mx-auto flex w-full max-w-[1200px] scroll-mt-6 flex-col gap-3.5 px-4 pt-10 md:px-10 md:pt-16 xl:px-6">
          <span className="text-[13px] font-black tracking-[.06em] text-brand-ink">GROW YOUR BASE</span>
          <h2 className="text-[26px] leading-tight font-black md:text-[34px]">Every subject is a room you build up</h2>
          <p className="max-w-[680px] text-[15px] leading-relaxed font-bold text-muted-foreground md:text-[17px]">
            Spend coins to level up items from Lv 1 to Lv 10. Max a room to unlock its next tier. It’s looks only, so it never changes quiz scores.
          </p>
          <div className="hidden overflow-hidden rounded-[28px] bg-[#c3eef5] md:block">
            <Image src="/qn/rooms/house.jpg" alt="Five connected rooms: science, maths, history, geography and reading" width={2400} height={386} className="h-auto w-full" priority={false} />
          </div>
          <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3.5">
            {SUBJECTS.map((s, i) => (
              <li key={s.id} className={cn("overflow-hidden rounded-2xl border border-line bg-card", i === 0 && "col-span-2 md:col-span-1")}>
                <Image src={`/qn/rooms/${s.id}.jpg`} alt="" width={1252} height={1026} className={cn("w-full bg-[#c3eef5] object-cover", i === 0 ? "h-[200px] md:h-[150px]" : "h-[120px] md:h-[150px]")} />
                <span className="block px-3 py-2.5 text-[15px] font-black">{s.room}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- games ---------- */}
        <section id="games" className="mx-auto flex w-full max-w-[1200px] scroll-mt-6 flex-col gap-3.5 px-4 pt-10 md:px-10 md:pt-16 xl:px-6">
          <span className="text-[13px] font-black tracking-[.06em] text-brand-ink">PLAY</span>
          <h2 className="text-[26px] leading-tight font-black md:text-[34px]">Party games built from what you’re learning</h2>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3.5">
            {PARTY_GAMES.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3.5">
                <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl text-lg font-black" style={{ background: g.tile, color: g.ink }} aria-hidden="true">
                  {g.glyph}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-base font-black">{g.name}</span>
                  <span className="text-[13px] font-bold text-muted-foreground">{g.players} players</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- parents ---------- */}
        <section id="parents" className="mx-auto w-full max-w-[1200px] scroll-mt-6 px-4 pt-10 md:px-10 md:pt-16 xl:px-6">
          <div className="flex flex-col gap-6 rounded-[28px] bg-night p-5 text-white md:flex-row md:items-center md:p-9">
            <div className="flex flex-1 flex-col gap-4">
              <span className="flex items-center gap-3">
                <Face id="mom" size={52} tint="#fde9f0" className="md:hidden" />
                <span className="text-[13px] font-black tracking-[.06em] text-mint-line">FOR PARENTS</span>
              </span>
              <h2 className="text-[24px] leading-tight font-black md:text-[32px]">Grown-ups stay in the loop</h2>
              <ul className="flex flex-col gap-3.5">
                {PARENT.map((p) => (
                  <li key={p.text} className="flex items-center gap-3 text-[15px] leading-snug font-extrabold md:text-[17px]">
                    <span className="flex size-[34px] shrink-0 items-center justify-center rounded-xl bg-[rgba(127,224,191,.16)]">
                      <p.icon className="size-[18px] text-mint-line" strokeWidth={2.4} />
                    </span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative hidden h-[280px] w-[280px] shrink-0 overflow-hidden rounded-3xl bg-[#314150] md:block" aria-hidden="true">
              <div className="absolute bottom-6 left-1/2 h-4 w-40 -translate-x-1/2 rounded-[50%] bg-[#3d4f5f]" />
              <Sprite id="mom" className="absolute bottom-2 left-1/2 w-[280px] -translate-x-1/2" />
            </div>
          </div>
        </section>

        {/* ---------- final cta ---------- */}
        <section className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-3.5 px-4 py-12 text-center md:px-10 md:py-20 xl:px-6">
          <span className="flex" aria-hidden="true">
            <Face id="nova" size={64} ring="#fff" />
            <Face id="mom" size={64} tint="#fde9f0" ring="#fff" className="-ml-3.5" />
            <Face id="dad" size={64} tint="#e6f0fc" ring="#fff" className="-ml-3.5" />
          </span>
          <h2 className="text-[26px] font-black md:text-[34px]">Ready for your first duel?</h2>
          <p className="text-[15px] font-bold text-muted-foreground md:text-[17px]">Setting up takes about two minutes.</p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Link href="/register" className={cta}>Create an account</Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "soft", size: "cta" }))}>Log in</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3.5 px-4 pt-6 pb-8 md:px-10 xl:px-6">
          <Logo size={32} />
          <nav aria-label="Footer" className="flex gap-5 text-sm font-extrabold text-muted-foreground">
            <a href="#how" className="py-2">How it works</a>
            <Link href="/login" className="py-2">Log in</Link>
            <Link href="/register" className="py-2">Create an account</Link>
          </nav>
          <span className="flex w-full items-center gap-1.5 text-[13px] font-bold text-muted-foreground">
            <BadgeCheck className="size-4 text-brand" /> Lessons and flashcards are always free.
          </span>
        </div>
      </footer>
    </div>
  );
}
