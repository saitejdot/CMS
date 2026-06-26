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

    const alreadyLiked = blog.likedBy.includes(visitorId);

    if (alreadyLiked) {
      // Unlike — remove visitor and decrement
      blog.likedBy = blog.likedBy.filter((id: string) => id !== visitorId);
      blog.likes = Math.max(0, blog.likes - 1);
      await blog.save();

      return NextResponse.json({
        success: true,
        likes: blog.likes,
        liked: false,
      });
    } else {
      // Like — add visitor and increment
      blog.likedBy.push(visitorId);
      blog.likes += 1;
      await blog.save();

      return NextResponse.json({
        success: true,
        likes: blog.likes,
        liked: true,
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}