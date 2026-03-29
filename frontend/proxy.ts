import { NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/new"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const login = request.cookies.get("login")?.value
    const regular = request.cookies.get("regular")?.value
    if (!login || !regular) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/new"],
}
