/**
 * GET /api/admin/subscribers
 *
 * Returns the full subscriber list (email + createdAt) for admin use.
 * Requires valid admin JWT — this endpoint must NEVER be public.
 *
 * Security layers:
 *   1. Middleware — front-line JWT check on /api/admin/*
 *   2. requireAdmin() — handler-level defence-in-depth
 *
 * Note: The public subscriber count remains available at /api/subscribers
 * (GET, count only — no emails exposed).
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { requireAdmin } from "@/lib/auth";
import { generateRequestId } from "@/lib/requestId";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reqId = generateRequestId();

  // Authorization (defence-in-depth)
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    await connectDB();

    const [subscribers, count] = await Promise.all([
      Subscriber.find().sort({ createdAt: -1 }).select("name email createdAt").lean(),
      Subscriber.countDocuments(),
    ]);

    return NextResponse.json({ success: true, count, subscribers });
  } catch (err) {
    console.error(`[${reqId}] Subscribers fetch failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
