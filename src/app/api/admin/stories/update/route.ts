/**
 * POST /api/admin/stories/update
 *
 * Updates an existing story post by ID, including lifecycle status.
 *
 * Security layers (in order):
 *   1. Middleware — front-line JWT check on /api/admin/*
 *   2. requireAdmin() — handler-level defence-in-depth
 *   3. CSRF check — Origin validation
 *   4. Zod validation — strict schema enforcement
 *   5. Payload size limit — 5 MB
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import { requireAdmin } from "@/lib/auth";
import { checkCSRF } from "@/lib/csrf";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB

const CATEGORIES = ["Tech", "Life", "Fitness", "Motivation", "Thoughts", "Philosophies", "Other",
  // Legacy support
  "tech", "fitness", "life", "motivation"] as const;

const UpdateStorySchema = z.object({
  _id: z.string().length(24, "Invalid story ID"),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5_000_000).optional(),
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional().nullable(),
});

export async function POST(request: Request) {
  const reqId = generateRequestId();

  // 1. Payload size guard
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: "Request too large" }, { status: 413 });
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
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = UpdateStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { _id, title, content, category, status, tags } = parsed.data;

  try {
    await connectDB();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (tags !== undefined) updateData.tags = tags ?? [];

    const updated = await Story.findByIdAndUpdate(_id, updateData, { new: true });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error(`[${reqId}] Story update failed:`, (err as Error).message);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
