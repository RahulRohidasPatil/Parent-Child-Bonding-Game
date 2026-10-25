import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PREFS_BOOT_SCRIPT } from "@/lib/prefs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Bundled locally (SIL OFL, see app/fonts/OFL.txt) so builds work without network access.
const nunito = localFont({
  src: "./fonts/nunito-latin-wght.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QuestNest · Learn together, play together",
    template: "%s · QuestNest",
  },
  description:
    "Turn schoolwork into family game night: scan your notes, get a lesson, flashcards and quizzes, then duel your family.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#cdeff5" },
    { media: "(prefers-color-scheme: dark)", color: "#101e24" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClerkProvider>{children}</ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
