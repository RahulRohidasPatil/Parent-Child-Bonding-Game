import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PREFS_BOOT_SCRIPT } from "@/lib/prefs";
import "./globals.css";

// Bundled locally (SIL OFL, see app/fonts/OFL.txt) so builds work without network access.
const nunito = localFont({
  src: "./fonts/nunito-latin-wght.woff2",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "QuestNest",
  title: {
    default: "QuestNest · Learn together, play together",
    template: "%s · QuestNest",
  },
  description:
    "Turn schoolwork into family game night: scan your notes, get a lesson, flashcards and quizzes, then duel your family.",
  appleWebApp: {
    capable: true,
    title: "QuestNest",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#cdeff5",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} light h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
