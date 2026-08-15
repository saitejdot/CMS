/**
 * Authentication utilities for the CMS admin system.
 *
 * Architecture:
 *   Login → signAdminJWT() → HTTP-only cookie
 *   Every privileged handler → requireAdmin() → AdminPrincipal
 *
 * The JWT itself is never logged. JWT_SECRET is never logged.
 * requireAdmin() throws NextResponse errors directly so that
 * callers can simply `await requireAdmin()` without try/catch.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminPrincipal } from "@/types/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = "admin_token";
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Configuration error — fail loudly at startup
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Sign a new admin JWT
// ---------------------------------------------------------------------------

export async function signAdminJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_EXPIRY_SECONDS)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

// ---------------------------------------------------------------------------
// Build the auth cookie options
// ---------------------------------------------------------------------------

export function buildAuthCookieOptions(maxAge: number = TOKEN_EXPIRY_SECONDS) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// ---------------------------------------------------------------------------
// requireAdmin()
//
// Call as the FIRST operation inside every privileged route handler.
// Returns the verified AdminPrincipal on success.
// Throws a NextResponse (401/403) on failure — callers should propagate it:
//
//   const principal = await requireAdmin();
//   if (principal instanceof NextResponse) return principal;
// ---------------------------------------------------------------------------

export async function requireAdmin(): Promise<AdminPrincipal | NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Validate expected claims
    if (
      typeof payload.sub !== "string" ||
      payload.sub !== "admin" ||
      (payload as Record<string, unknown>).role !== "admin" ||
      typeof payload.jti !== "string" ||
      typeof payload.exp !== "number"
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return {
      sub: payload.sub,
      role: "admin",
      jti: payload.jti,
      exp: payload.exp,
    };
  } catch {
    // JWT verification failed (expired, tampered, wrong secret)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

// ---------------------------------------------------------------------------
// Cookie name export (for use in login/logout routes)
// ---------------------------------------------------------------------------
export { COOKIE_NAME };
