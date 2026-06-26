import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { id } = await req.json();

    await Blog.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}