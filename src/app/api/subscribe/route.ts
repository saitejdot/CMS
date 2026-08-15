/**
 * POST /api/subscribe
 *
 * Public endpoint. Adds an email to the subscriber list.
 *
 * Security layers:
 *   1. Rate limiting — 3 requests / hour / IP
 *   2. Payload size limit — 1 KB
 *   3. Zod validation — valid email format, bounded length
 *   4. DB unique index — prevents duplicate subscribers atomically
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { rateLimiters, getClientIP } from "@/lib/rateLimit";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 1024; // 1 KB

const SubscribeSchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: Request) {
  const reqId = generateRequestId();

  // 1. Payload size guard
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { success: false, error: "Request too large" },
      { status: 413 }
    );
  }

  // 2. Rate limiting
  const ip = getClientIP(request);
  const rateResult = await rateLimiters.subscribe.limit(ip);
  if (!rateResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // 3. Parse and validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid email address" },
      { status: 400 }
    );
  }

  // 4. Persist — DB unique index prevents duplicates atomically
  try {
    await connectDB();
    await Subscriber.create({ email: parsed.data.email });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // MongoDB duplicate key error code
    if ((err as { code?: number }).code === 11000) {
      // Treat duplicate as success — don't leak whether email is subscribed
      return NextResponse.json({ success: true });
    }
    console.error(`[${reqId}] Subscribe failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}