import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Optimistic route guard: app pages need a session cookie, auth pages send signed-in
 * users home. The real check happens in the API route handlers (lib/server/session.ts).
 */
const APP_PREFIXES = ["/home", "/learn", "/play", "/base", "/shop", "/quests", "/friends", "/profile", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("qn_at") || request.cookies.has("qn_rt");
  const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isApp && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home",
    "/learn/:path*",
    "/play/:path*",
    "/base",
    "/shop",
    "/quests",
    "/friends",
    "/profile",
    "/settings",
    "/login",
    "/register",
  ],
};
