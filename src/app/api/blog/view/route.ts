import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { slug, visitorId } = await req.json();

    if (!slug || !visitorId) {
      return NextResponse.json(
        { success: false, error: "Missing slug or visitorId" },
        { status: 400 }
      );
    }

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // Only increment if this visitor hasn't viewed before
    const alreadyViewed = blog.viewedBy.includes(visitorId);

    if (!alreadyViewed) {
      blog.viewedBy.push(visitorId);
      blog.views += 1;
      await blog.save();
    }

    return NextResponse.json({
      success: true,
      views: blog.views,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
