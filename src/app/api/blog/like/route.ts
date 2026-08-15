/**
 * POST /api/blog/like
 *
 * Public endpoint. Toggles a like on a blog post.
 *
 * Security layers:
 *   1. Rate limiting — 30 requests / minute / IP
 *   2. Payload size limit — 2 KB
 *   3. Zod validation — slug and visitorId format enforced
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { rateLimiters, getClientIP } from "@/lib/rateLimit";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 2048; // 2 KB

const LikeSchema = z.object({
  slug: z.string().min(1).max(200),
  visitorId: z.string().uuid(),
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
  const rateResult = await rateLimiters.interact.limit(ip);
  if (!rateResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
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

  const parsed = LikeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const { slug, visitorId } = parsed.data;

  // 4. Business logic
  try {
    await connectDB();

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    const alreadyLiked = blog.likedBy.includes(visitorId);

    if (alreadyLiked) {
      blog.likedBy = blog.likedBy.filter((id: string) => id !== visitorId);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      blog.likedBy.push(visitorId);
      blog.likes += 1;
    }

    await blog.save();

    return NextResponse.json({
      success: true,
      likes: blog.likes,
      liked: !alreadyLiked,
    });
  } catch (err) {
    console.error(`[${reqId}] Like failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}