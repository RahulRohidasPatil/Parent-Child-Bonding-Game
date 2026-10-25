import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "QuestNest — Learn and play together",
    short_name: "QuestNest",
    description: "Learn from your notes, play with friends, and grow your base.",
    lang: "en",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafb",
    theme_color: "#2e8a69",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
