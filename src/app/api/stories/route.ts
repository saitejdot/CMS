import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    // Only return PUBLISHED stories to the public
    const stories = await Story.find({ status: "PUBLISHED" })
      .sort({ createdAt: -1 })
      .select("_id title slug category createdAt likes views content")
      .lean();

    return NextResponse.json({ success: true, data: stories });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
