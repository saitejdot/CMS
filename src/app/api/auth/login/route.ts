/**
 * POST /api/auth/login
 *
 * Authenticates the admin by comparing the submitted password against
 * ADMIN_PASSWORD (environment variable). On success, issues a signed JWT
 * stored in an HttpOnly cookie.
 *
 * Security layers:
 *   1. Rate limiting — 5 attempts / 15 minutes / IP (brute-force protection)
 *   2. Zod validation — rejects malformed request bodies
 *   3. Payload size limit — prevents large body attacks
 *   4. Constant-time-safe comparison — uses timingSafeEqual to prevent
 *      timing side-channel attacks on the password comparison
 *   5. JWT — signed with HS256 using JWT_SECRET, expires in 24 hours
 *   6. HttpOnly cookie — inaccessible to client-side JavaScript
 *
 * Never logs the password, the JWT, or JWT_SECRET.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "crypto";
import { signAdminJWT, buildAuthCookieOptions, COOKIE_NAME } from "@/lib/auth";
import { rateLimiters, getClientIP } from "@/lib/rateLimit";
import { generateRequestId } from "@/lib/requestId";

// Payload size guard (1 KB is more than sufficient for a password field)
const MAX_BODY_BYTES = 1024;

const LoginSchema = z.object({
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const reqId = generateRequestId();

  // 1. Payload size check
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Request too large" },
      { status: 413 }
    );
  }

  // 2. Rate limiting
  const ip = getClientIP(request);
  const rateResult = await rateLimiters.login.limit(ip);
  if (!rateResult.success) {
    console.warn(`[${reqId}] Login rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { success: false, error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  // 3. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const { password } = parsed.data;

  // 4. Constant-time password comparison (prevents timing attacks)
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error(`[${reqId}] ADMIN_PASSWORD is not configured`);
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  let passwordMatches = false;
  try {
    const supplied = Buffer.from(password);
    const expected = Buffer.from(adminPassword);
    // timingSafeEqual requires equal-length buffers
    if (supplied.length === expected.length) {
      passwordMatches = timingSafeEqual(supplied, expected);
    }
  } catch {
    passwordMatches = false;
  }

  if (!passwordMatches) {
    console.warn(`[${reqId}] Failed login attempt from IP: ${ip}`);
    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  // 5. Issue JWT and set HttpOnly cookie
  try {
    const token = await signAdminJWT();
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, buildAuthCookieOptions());
    return response;
  } catch (err) {
    console.error(`[${reqId}] JWT signing failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
