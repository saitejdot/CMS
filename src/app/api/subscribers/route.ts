import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscriber from "@/models/Subscriber";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin")?.value === "true";

    const count = await Subscriber.countDocuments();

    if (!isAdmin) {
      // Public: only return the count
      return NextResponse.json({ success: true, count });
    }

    // Admin: return count + full list, newest first
    const subscribers = await Subscriber.find()
      .sort({ createdAt: -1 })
      .select("email createdAt")
      .lean();

    return NextResponse.json({ success: true, count, subscribers });
  } catch (err) {
    console.error("[/api/subscribers] error:", err);
    return NextResponse.json({ success: false, count: 0 }, { status: 500 });
  }
}
