import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAppRoute = createRouteMatcher([
  "/home(.*)",
  "/learn(.*)",
  "/play(.*)",
  "/base(.*)",
  "/shop(.*)",
  "/quests(.*)",
  "/friends(.*)",
  "/profile(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isAppRoute(request)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
