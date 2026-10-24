"use client";

import Link from "next/link";
import { BarChart3, ChevronRight, Gamepad2, LogOut, MessageCircleHeart, Settings2, Shirt } from "lucide-react";
import { Segmented } from "@/components/splash/segmented";
import { Avatar, Eyebrow, Page, Panel, Pill, roleLabel } from "@/components/kay/ui";
import { DEMO_ME, DEMO_PARTNER, type Role } from "@/lib/kay/data";
import { sessionStore, useSession } from "@/lib/kay/store";

const LINKS = [
  { href: "/me/progress", icon: BarChart3, label: "My progress", hint: "What you know, what to practise" },
  { href: "/me/settings", icon: Settings2, label: "Settings & accessibility", hint: "Text size, captions, contrast, motion" },
  { href: "/rewards/avatar", icon: Shirt, label: "Customise avatar", hint: "Spend points on gear" },
];

/** Demo helper: switch whose view you're looking at. */
function viewAs(role: Role) {
  if (role === "solo") {
    sessionStore.set({ me: { ...DEMO_ME, role: "solo" }, partner: null, teamName: null });
  } else if (role === "kid") {
    sessionStore.set({ me: DEMO_ME, partner: DEMO_PARTNER, teamName: "Comet Crew" });
  } else {
    sessionStore.set({ me: DEMO_PARTNER, partner: DEMO_ME, teamName: "Comet Crew" });
  }
}

export default function Me() {
  const { me, partner, teamName } = useSession();
  return (
    <Page title="Me">
      <Panel className="flex items-center gap-4">
        <Avatar person={me} size={80} />
        <div>
          <p className="font-heading text-2xl font-semibold">{me.name}</p>
          <Pill>{roleLabel(me.role)}</Pill>
        </div>
      </Panel>

      <Panel>
        <Eyebrow>Team</Eyebrow>
        {partner && teamName ? (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex -space-x-3" aria-hidden>
              <Avatar person={me} size={48} />
              <Avatar person={partner} size={48} />
            </div>
            <div className="flex-1">
              <p className="font-heading text-xl font-semibold">{teamName}</p>
              <p className="text-sm text-muted-foreground">
                With {partner.name} · team code <span className="font-mono font-bold">QBMX</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            <p className="text-sm">You&apos;re learning solo. Create a team or join one with a code.</p>
            <Link href="/onboarding" className="text-sm font-bold text-primary underline underline-offset-4">
              Set up a team
            </Link>
          </div>
        )}
      </Panel>

      <Panel className="p-2">
        <ul>
          {[
            ...LINKS,
            ...(me.role === "parent" ? [{ href: "/explain", icon: MessageCircleHeart, label: "Explain it to my child", hint: "Kid-friendly ways to explain" }] : []),
            { href: "/splash", icon: Gamepad2, label: "Splash: family party game", hint: "Bonus imposter word game" },
          ].map(({ href, icon: Icon, label, hint }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <span className="grid size-10 place-items-center rounded-xl bg-muted">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{label}</span>
                  <span className="block text-sm text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="flex flex-col gap-2 border-dashed bg-transparent shadow-none">
        <Eyebrow>Demo · view the app as</Eyebrow>
        <Segmented<Role>
          name="view-as"
          value={me.role}
          onChange={viewAs}
          options={[
            { value: "kid", label: "Kid" },
            { value: "parent", label: "Parent" },
            { value: "solo", label: "Solo" },
          ]}
        />
      </Panel>

      <Link href="/" className="flex items-center justify-center gap-2 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">
        <LogOut className="size-4" aria-hidden /> Sign out
      </Link>
    </Page>
  );
}
