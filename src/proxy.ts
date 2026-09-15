import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db/client";

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/setup-totp", "/admin"];
const AUTH_PAGES = ["/login", "/signup", "/login-totp"];
const SESSION_COOKIE = "gosheros_session";

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionUserId = await getSessionUserId(request);

  // A cryptographically valid JWT can still name a user that no longer exists
  // (the account got recreated, or the DB was reseeded). Trusting the token
  // alone here used to cause an infinite /dashboard <-> /login redirect loop:
  // proxy would wave the stale cookie through to /dashboard, the page's own
  // DB-backed auth check would bounce it to /login, and proxy would then see
  // the same still-valid token on /login and bounce it straight back. So this
  // also confirms the user row still exists, and clears the cookie once when
  // it doesn't, instead of leaving the browser to retry forever.
  const authed = sessionUserId ? !!(await prisma.user.findUnique({ where: { id: sessionUserId }, select: { id: true } })) : false;
  const staleCookie = !!sessionUserId && !authed;

  let response: NextResponse;
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    response = NextResponse.redirect(url);
  } else if (AUTH_PAGES.includes(pathname) && authed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  if (staleCookie) response.cookies.delete(SESSION_COOKIE);
  return response;
}

// Exclude background <Link> prefetches (next-router-prefetch / purpose: prefetch
// headers) — proxy still runs for them by default, and redirecting a prefetch
// isn't cacheable, so the client keeps retrying it, hammering the server with
// endless redirected requests. Real navigations (and requireUser()/
// requireOnboardedUser() on each page) still enforce auth. The matcher must be
// a fully static literal — Next parses it at build time and won't accept
// anything derived at runtime (a .map(), or even a referenced variable).
export const config = {
  matcher: [
    {
      source: "/dashboard/:path*",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/onboarding",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/setup-totp",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/admin/:path*",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/login",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/signup",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
    {
      source: "/login-totp",
      missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }],
    },
  ],
};
