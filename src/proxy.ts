import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/setup-totp"];
const AUTH_PAGES = ["/login", "/signup", "/login-totp"];
const SESSION_COOKIE = "gosheros_session";

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await hasValidSession(request);

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/setup-totp", "/login", "/signup", "/login-totp"],
};
