/**
 * GET /api/subscribers
 *
 * PUBLIC endpoint — returns subscriber COUNT only.
 * Never returns email addresses. Never returns private data.
 *
 * Full subscriber list (with emails) is at /api/admin/subscribers
 * which requires admin authentication.
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const count = await Subscriber.countDocuments();
    return NextResponse.json({ success: true, count });
  } catch {
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}
