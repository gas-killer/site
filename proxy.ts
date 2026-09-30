import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

// Cookie presence only; pages and API routes still validate the session itself.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  const login = new URL("/login", request.url)
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/analyzer/:path*", "/dashboard/:path*"],
}
