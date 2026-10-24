"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CodeInput } from "@/components/splash/code-input";
import { Segmented } from "@/components/splash/segmented";
import { SwitchRow } from "@/components/kay/switch-row";
import { Avatar, Eyebrow, Page, Panel } from "@/components/kay/ui";
import { AVATAR_COLORS, type AvatarColor } from "@/lib/game/types";
import { DEMO_PARTNER, type Person, type Role } from "@/lib/kay/data";
import { prefsStore, sessionStore, usePrefs } from "@/lib/kay/store";
import { cn } from "@/lib/utils";

const ROLES: { role: Role; avatar: Person; title: string; body: string }[] = [
  { role: "parent", avatar: { name: "", role: "parent", color: "coral", accessory: "glasses" }, title: "I'm a parent", body: "Learn alongside your child and team up for competitions." },
  { role: "kid", avatar: { name: "", role: "kid", color: "sky", accessory: "cap" }, title: "I'm a kid", body: "Learn the weekly topic and team up with your grown-up." },
  { role: "solo", avatar: { name: "", role: "solo", color: "mint", accessory: "headphones" }, title: "Just me", body: "Learn on your own or play with friends. Team up any time." },
];

const STEPS = ["Who", "You", "Team", "Goal"] as const;
const TEAM_CODE = "QBMX";

export default function Onboarding() {
  const router = useRouter();
  const prefs = usePrefs();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<AvatarColor>("sky");
  const [teamName, setTeamName] = useState("Comet Crew");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [goal, setGoal] = useState(15);

  const me: Person = { name: name.trim() || "You", role: role ?? "solo", color, accessory: "none" };
  const canNext = [role !== null, name.trim().length > 0, role !== "kid" || code.length === 4 || code === "", true][step];
  const last = step === STEPS.length - 1;

  const finish = () => {
    const partnered = role !== "solo" && (role === "parent" || code.length === 4);
    sessionStore.set({
      me,
      partner: partnered ? { ...DEMO_PARTNER, role: role === "parent" ? "kid" : "parent", name: role === "parent" ? "Aarav" : "Priya", color: role === "parent" ? "sky" : "coral" } : null,
      teamName: partnered ? teamName || "Our Team" : null,
      dailyGoal: goal,
    });
    router.push("/home");
  };

  return (
    <Page
      nav={false}
      actions={
        <div className="flex w-full items-center justify-between">
          {step === 0 ? (
            <Link href="/" aria-label="Back" className={cn(buttonVariants({ variant: "glass", size: "icon-lg" }), "size-11 rounded-full")}>
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <Button variant="glass" size="icon-lg" className="size-11 rounded-full" onClick={() => setStep(step - 1)} aria-label="Back">
              <ArrowLeft className="size-5" />
            </Button>
          )}
          <ol className="flex items-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <li key={s} className={cn("h-2.5 rounded-full bg-muted transition-all", i === step ? "w-8 bg-primary" : "w-2.5", i < step && "bg-primary/50")} />
            ))}
          </ol>
          <span className="size-11" />
        </div>
      }
      footer={
        <Button size="game" className="w-full" disabled={!canNext} onClick={last ? finish : () => setStep(step + 1)}>
          {last ? "Start learning" : "Continue"} <ArrowRight />
        </Button>
      }
    >
      <h1 className="sr-only">Set up your Kay account</h1>
      {step === 0 && (
        <fieldset key="who" className="flex flex-col gap-3 animate-rise">
          <legend className="mb-3 font-heading text-3xl font-semibold">Who&apos;s using Kay?</legend>
          {ROLES.map((r) => (
            <label
              key={r.role}
              className={cn(
                "flex cursor-pointer items-center gap-4 rounded-3xl border-2 bg-card p-4 transition",
                "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                role === r.role && "border-primary bg-primary/8",
              )}
            >
              <input type="radio" name="role" className="sr-only" checked={role === r.role} onChange={() => setRole(r.role)} />
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-muted" aria-hidden>
                <Avatar person={r.avatar} size={r.role === "kid" ? 36 : 44} />
              </span>
              <span className="flex-1">
                <span className="block font-heading text-xl font-semibold">{r.title}</span>
                <span className="block text-sm text-muted-foreground">{r.body}</span>
              </span>
              {role === r.role && <Check className="size-6 text-primary" aria-hidden />}
            </label>
          ))}
        </fieldset>
      )}

      {step === 1 && (
        <div key="you" className="flex flex-col gap-6 animate-rise">
          <h2 className="font-heading text-3xl font-semibold">Make your avatar</h2>
          <div className="flex justify-center">
            <Avatar person={me} size={120} className="animate-float" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="name">
              <Eyebrow>Your first name</Eyebrow>
            </label>
            <Input
              id="name"
              value={name}
              maxLength={16}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
              className="h-14 rounded-2xl bg-card px-4 font-heading text-xl md:text-xl"
              placeholder={role === "parent" ? "e.g. Priya" : "e.g. Aarav"}
            />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2">
              <Eyebrow>Colour</Eyebrow>
            </legend>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_COLORS.map((c) => (
                <label
                  key={c}
                  className={cn(
                    "grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 bg-card transition",
                    "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                    color === c && "border-primary",
                  )}
                >
                  <input type="radio" name="color" className="sr-only" checked={color === c} onChange={() => setColor(c)} aria-label={c} />
                  <span className="size-7 rounded-full" style={{ background: `var(--${c})` }} />
                </label>
              ))}
            </div>
          </fieldset>
          <p className="text-sm text-muted-foreground">You can unlock hats and gear for your avatar by learning.</p>
        </div>
      )}

      {step === 2 && role === "parent" && (
        <div key="team-p" className="flex flex-col gap-5 animate-rise">
          <h2 className="font-heading text-3xl font-semibold">Create your team</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="team">
              <Eyebrow>Team name</Eyebrow>
            </label>
            <Input id="team" value={teamName} maxLength={20} onChange={(e) => setTeamName(e.target.value)} className="h-14 rounded-2xl bg-card px-4 font-heading text-xl md:text-xl" />
          </div>
          <Panel className="flex flex-col items-center gap-3 text-center">
            <Eyebrow>Your child enters this code on their phone</Eyebrow>
            <div className="flex gap-2" aria-label={`Team code ${TEAM_CODE.split("").join(" ")}`}>
              {TEAM_CODE.split("").map((c, i) => (
                <span key={i} aria-hidden className="grid size-14 place-items-center rounded-2xl bg-sun font-heading text-3xl font-bold text-ink">
                  {c}
                </span>
              ))}
            </div>
            <Button
              variant="glass"
              className="h-10 rounded-full px-4"
              onClick={() => {
                navigator.clipboard?.writeText(TEAM_CODE).catch(() => {});
                setCopied(true);
              }}
            >
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy code"}
            </Button>
          </Panel>
          <p className="text-center text-sm text-muted-foreground">You can carry on now. We&apos;ll let you know when they join.</p>
        </div>
      )}

      {step === 2 && role === "kid" && (
        <div key="team-k" className="flex flex-col gap-5 animate-rise">
          <h2 className="font-heading text-3xl font-semibold">Join your grown-up&apos;s team</h2>
          <p className="text-muted-foreground">Ask them for the 4-letter team code on their phone.</p>
          <CodeInput value={code} onChange={setCode} />
          {code.length === 4 && (
            <Panel className="flex items-center gap-3 animate-pop">
              <Avatar person={DEMO_PARTNER} size={52} />
              <div>
                <p className="font-heading text-lg font-semibold">Comet Crew</p>
                <p className="text-sm text-muted-foreground">You&apos;ll team up with {DEMO_PARTNER.name}</p>
              </div>
            </Panel>
          )}
          <button type="button" className="text-sm font-bold text-primary underline underline-offset-4" onClick={() => { setCode(""); setStep(3); }}>
            Skip for now: I&apos;ll learn on my own first
          </button>
        </div>
      )}

      {step === 2 && role === "solo" && (
        <div key="team-s" className="flex flex-col items-center gap-4 text-center animate-rise">
          <Avatar person={me} size={96} mood="happy" />
          <h2 className="font-heading text-3xl font-semibold">Flying solo</h2>
          <p className="max-w-xs text-muted-foreground">
            Pick any topic, learn at your own pace, and play matches with friends or against Kay&apos;s practice bot.
          </p>
          <Panel className="w-full text-left text-sm">
            Want a teammate later? Go to <strong>Me → Team</strong> to create or join one.
          </Panel>
        </div>
      )}

      {step === 3 && (
        <div key="goal" className="flex flex-col gap-6 animate-rise">
          <h2 className="font-heading text-3xl font-semibold">Daily goal</h2>
          <Segmented
            name="goal"
            value={goal}
            onChange={setGoal}
            options={[10, 15, 20].map((m) => ({ value: m, label: `${m} min` }))}
          />
          <p className="-mt-3 text-sm text-muted-foreground">15 minutes a day is plenty to be ready for Friday.</p>

          <Panel className="divide-y py-2">
            <h3 className="py-2 font-heading text-lg font-semibold">Make Kay work for you</h3>
            <SwitchRow icon="🔠" label="Bigger text" checked={prefs.text !== "md"} onChange={(v) => prefsStore.set({ text: v ? "lg" : "md" })} />
            <SwitchRow icon="💬" label="Captions on videos" hint="On by default" checked={prefs.captions} onChange={(v) => prefsStore.set({ captions: v })} />
            <SwitchRow icon="🔊" label="Read lessons aloud" checked={prefs.readAloud} onChange={(v) => prefsStore.set({ readAloud: v })} />
            <SwitchRow icon="🐢" label="Less motion" checked={prefs.motion === "reduce"} onChange={(v) => prefsStore.set({ motion: v ? "reduce" : "full" })} />
          </Panel>
          <p className="text-center text-sm text-muted-foreground">
            More options any time in <Link href="/me" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>Me → Settings</Link>
          </p>
        </div>
      )}
    </Page>
  );
}
