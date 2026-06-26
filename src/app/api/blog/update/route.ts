import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { _id, title, content, category, tags } = await req.json();

    // Generate new slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      {
        title,
        slug,
        content,
        category,
        tags,
      },
      { new: true }
    );

    if (!updatedBlog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedBlog,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}