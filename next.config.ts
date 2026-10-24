import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Quizzes and flashcards moved from Learn to Play › Solo; keep older links working.
  async redirects() {
    return [
      { source: "/learn/quiz/:id", destination: "/play/solo/quiz/:id", permanent: false },
      { source: "/learn/flashcards/:id", destination: "/play/solo/flashcards/:id", permanent: false },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
