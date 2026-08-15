/**
 * POST /api/admin/blog/update
 *
 * Updates an existing blog post by ID.
 *
 * Security layers (in order):
 *   1. Middleware — front-line JWT check on /api/admin/*
 *   2. requireAdmin() — handler-level defence-in-depth
 *   3. CSRF check — Origin validation
 *   4. Zod validation — strict schema enforcement
 *   5. Payload size limit — 5 MB (legacy base64 content; tighten post-migration)
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { requireAdmin } from "@/lib/auth";
import { checkCSRF } from "@/lib/csrf";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB — temporary, reduce after media migration

const UpdateBlogSchema = z.object({
  _id: z.string().length(24, "Invalid blog ID"),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5_000_000),
  category: z.enum(["tech", "fitness", "life", "motivation"]),
  tags: z.array(z.string().max(50)).max(10).optional(),
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

  // 2. Authorization
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  // 3. CSRF
  const csrfError = checkCSRF(request);
  if (csrfError) return csrfError;

  // 4. Parse and validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = UpdateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { _id, title, content, category, tags } = parsed.data;

  // 5. Business logic
  try {
    await connectDB();

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      { title, slug, content, category, tags },
      { new: true }
    );

    if (!updatedBlog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedBlog });
  } catch (err) {
    console.error(`[${reqId}] Blog update failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
