/**
 * Next.js Middleware — front-line security gateway.
 *
 * Protects:
 *   /admin/*       — admin UI pages
 *   /api/admin/*   — privileged admin API routes
 *
 * Public routes are NOT touched:
 *   /api/story      — public story listing
 *   /api/story/like — public like endpoint
 *   /api/story/view — public view tracking
 *   /api/subscribe — public subscription
 *   /api/banners   — public banner media
 *   /api/unsubscribe
 *
 * IMPORTANT: Middleware is the FIRST security layer only.
 * Every privileged route handler MUST also call requireAdmin()
 * independently. Do not rely on middleware alone.
 *
 * Cookie: admin_token (HttpOnly, Secure, SameSite=Lax, Path=/)
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_token";
const LOGIN_PATH = "/admin/login";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Determine if this route requires admin auth
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  // Allow the login page itself through (prevent redirect loop)
  if (pathname === LOGIN_PATH || pathname === "/admin/login/") {
    return NextResponse.next();
  }

  if (!isAdminPage && !isAdminApi) {
    // Public route — pass through without inspection
    return NextResponse.next();
  }

  // Protected route — verify JWT
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectOrUnauthorized(request, isAdminApi);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Validate role claim (lightweight — full validation is in requireAdmin())
    if ((payload as Record<string, unknown>).role !== "admin") {
      return redirectOrUnauthorized(request, isAdminApi);
    }

    // Valid — pass through to the route handler
    return NextResponse.next();
  } catch {
    // Expired or tampered token
    return redirectOrUnauthorized(request, isAdminApi);
  }
}

function redirectOrUnauthorized(
  request: NextRequest,
  isApi: boolean
): NextResponse {
  if (isApi) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  // Browser request — redirect to login
  const loginUrl = new URL(LOGIN_PATH, request.url);
  return NextResponse.redirect(loginUrl);
}

// ---------------------------------------------------------------------------
// Matcher — only run middleware on protected paths
// ---------------------------------------------------------------------------

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
