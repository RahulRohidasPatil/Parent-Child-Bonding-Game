import { Camera, Swords } from "lucide-react";
import { Logo } from "@/components/qn/brand";
import { Sprite } from "@/components/qn/sprite";

/** Phone/tablet: sky band with the family on top of the form. Desktop: story panel on the left. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-card lg:flex-row">
      <section className="relative overflow-hidden bg-stage lg:sticky lg:top-0 lg:h-dvh lg:w-[52%] lg:max-w-[760px] lg:shrink-0">
        <div className="relative z-10 flex items-center px-4 pt-4 md:px-10 md:pt-8 lg:px-14 lg:pt-11">
          <Logo size={44} />
        </div>
        <div className="relative hidden flex-col gap-3 px-14 pt-10 lg:flex">
          <span className="max-w-[560px] text-[46px] leading-[1.05] font-black">Turn schoolwork into family game night.</span>
          <span className="max-w-[540px] text-lg font-bold text-[#3f6470]">Snap your notes, get a study plan, then duel Mom and Dad. Earn coins to grow your own base.</span>
          <span className="mt-3 flex flex-col items-start gap-2.5">
            <span className="flex h-10 items-center gap-2.5 rounded-full bg-card pr-4 pl-2.5 text-[15px] font-extrabold">
              <span className="flex size-[26px] items-center justify-center rounded-full bg-brand-soft"><Camera className="size-[15px] text-brand" strokeWidth={2.6} /></span>
              Scan notes, get flashcards and quizzes
            </span>
            <span className="flex h-10 items-center gap-2.5 rounded-full bg-card pr-4 pl-2.5 text-[15px] font-extrabold">
              <span className="flex size-[26px] items-center justify-center rounded-full bg-rose"><Swords className="size-[15px] text-rose-strong" strokeWidth={2.6} /></span>
              Duel your family, one phone or many
            </span>
          </span>
        </div>
        {/* family art: compact band on phone/tablet, large on desktop */}
        <div className="relative mx-auto h-[200px] w-[330px] md:h-[300px] md:w-[520px] lg:absolute lg:bottom-0 lg:left-1/2 lg:h-[420px] lg:w-[620px] lg:-translate-x-1/2" aria-hidden="true">
          <div className="absolute bottom-2 left-1/2 h-5 w-[240px] -translate-x-1/2 rounded-[50%] bg-stage-floor md:h-8 md:w-[400px] lg:bottom-6 lg:w-[460px]" />
          <Sprite id="mom" className="absolute bottom-2 left-1/2 w-[192px] -translate-x-[80%] md:w-[288px] lg:bottom-6 lg:w-[372px]" />
          <Sprite id="dad" className="absolute bottom-2 left-1/2 w-[192px] -translate-x-[20%] md:w-[288px] lg:bottom-6 lg:w-[372px]" />
          <Sprite id="nova" className="absolute bottom-0 left-1/2 w-[192px] -translate-x-1/2 md:w-[288px] lg:bottom-4 lg:w-[372px]" />
          <Sprite id="cat" className="absolute bottom-2 left-[calc(50%+104px)] hidden w-16 md:block md:left-[calc(50%+150px)] lg:bottom-6 lg:left-[calc(50%+190px)] lg:w-20" />
        </div>
      </section>
      <section className="-mt-6 flex flex-1 justify-center rounded-t-[28px] bg-card px-4 pt-7 pb-10 md:-mt-8 md:rounded-t-[36px] md:px-10 md:pt-9 lg:mt-0 lg:items-center lg:rounded-none lg:py-12">
        <div className="relative z-10 w-full max-w-[480px]">{children}</div>
      </section>
    </div>
  );
}
