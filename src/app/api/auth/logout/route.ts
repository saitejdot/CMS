/**
 * POST /api/auth/logout
 *
 * Clears the admin JWT cookie. No auth required — clearing a
 * cookie is idempotent and harmless if called unauthenticated.
 */

import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expire immediately
  });

  return response;
}