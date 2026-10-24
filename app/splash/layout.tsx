import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Splash — The Imposter Game",
  description:
    "A family imposter game. Everyone gets the secret word except one sneaky splash. Give clues, talk it out, and vote!",
};

/** Splash keeps its own night-time palette, independent of the app theme. */
export default function SplashLayout({ children }: LayoutProps<"/splash">) {
  return <div className="theme-splash flex min-h-dvh flex-1 flex-col bg-background text-foreground">{children}</div>;
}
