/**
 * POST /api/admin/story/create
 *
 * Creates a new story post and sends email notifications to all subscribers.
 *
 * Security layers (in order):
 *   1. Middleware — front-line JWT check on /api/admin/*
 *   2. requireAdmin() — handler-level defence-in-depth verification
 *   3. CSRF check — Origin validation
 *   4. Zod validation — strict schema enforcement
 *   5. Payload size limit — 5 MB (accommodates legacy base64 content)
 *
 * Note: The 5 MB limit is temporarily required because the existing editor
 * stores media as base64 strings inside HTML content. This limit will be
 * reduced to ~100 KB after the Phase 1B media migration to Cloudflare.
 *
 * Email notifications are sent in a best-effort try/catch — email failure
 * does NOT prevent story creation from succeeding.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import Subscriber from "@/models/Subscriber";
import { notifySubscribers } from "@/lib/mail";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkCSRF } from "@/lib/csrf";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB — temporary, see note above

const CreateStorySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(250).optional(),
  content: z.string().min(1).max(5_000_000),
  category: z.enum(["Tech", "Life", "Fitness", "Motivation", "Thoughts", "Philosophies", "Other",
    "tech", "fitness", "life", "motivation"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"]).default("DRAFT"),
  tags: z.array(z.string().max(50)).max(10).optional(),
  coverImage: z.string().max(2000).optional(),
  sendEmail: z.boolean().optional().default(true),
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

  // 2. Authorization (defence-in-depth — middleware already checked)
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  // 3. CSRF
  const csrfError = checkCSRF(request);
  if (csrfError) return csrfError;

  // 4. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = CreateStorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const { title, slug: rawSlug, content, category, status, tags, coverImage, sendEmail } = parsed.data;

    const slug = rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const newStory = await Story.create({
      title, slug, content, category, status, tags, coverImage,
    });

    // Email notifications — fire and forget via Next.js `after`
    if (sendEmail) {
      after(async () => {
        await notifySubscribers(newStory._id.toString(), title, slug, category, reqId);
      });
    }

    return NextResponse.json({ success: true, data: newStory });
  } catch (err) {
    console.error(`[${reqId}] Story create failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
