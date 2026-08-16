import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import Story from "@/models/Story";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/admin/stories — returns ALL stories (all statuses) for the admin
export async function GET(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    await connectDB();
    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .select("_id title slug category status likes views tags createdAt")
      .lean();

    return NextResponse.json({ success: true, data: stories });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
