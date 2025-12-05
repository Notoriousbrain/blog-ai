import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = getSessionCookie(request);
  const loggedIn = !!session;

  if (
    pathname === "/" ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/contact")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/signin" && loggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/blog/create") {
    if (!loggedIn) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
