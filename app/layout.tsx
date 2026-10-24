import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { APP_NAME } from "@/lib/kay/data";
import { PREFS_BOOT_SCRIPT } from "@/lib/kay/prefs-boot";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Learn together`, template: `%s · ${APP_NAME}` },
  description:
    "Parents and kids learn the same topic each week, 15 minutes a day on their own phones, then team up for the end-of-week competition.",
};

export const viewport: Viewport = {
  themeColor: "#fbf7ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
      // data-* theme/text/contrast/motion attributes are set by the boot script before paint
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: PREFS_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
