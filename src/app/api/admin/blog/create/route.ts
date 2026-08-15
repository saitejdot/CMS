/**
 * POST /api/admin/blog/create
 *
 * Creates a new blog post and sends email notifications to all subscribers.
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
 * does NOT prevent blog creation from succeeding.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import Subscriber from "@/models/Subscriber";
import { sendEmail } from "@/lib/mail";
import { requireAdmin } from "@/lib/auth";
import { checkCSRF } from "@/lib/csrf";
import { generateRequestId } from "@/lib/requestId";

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB — temporary, see note above

const CreateBlogSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5_000_000),
  category: z.enum(["tech", "fitness", "life", "motivation"]),
  tags: z.array(z.string().max(50)).max(10).optional(),
  coverImage: z.string().max(2000).optional(),
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

  const parsed = CreateBlogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, content, category, tags, coverImage } = parsed.data;

  // 5. Business logic
  try {
    await connectDB();

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const newBlog = await Blog.create({
      title,
      slug,
      content,
      category,
      tags,
      coverImage,
    });

    // Email notifications — best-effort, does not affect blog creation result
    try {
      const subscribers = await Subscriber.find().select("email").lean();
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "https://tejwrites.vercel.app";
      const blogUrl = `${baseUrl}/blog/${slug}`;

      for (const sub of subscribers) {
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`;
        const emailHtml = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="background-color: #fcde7b; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; color: #383c45; letter-spacing: 1px;">Naga Sai Teja</h1>
                <p style="margin: 5px 0 0; font-size: 14px; color: #383c45; opacity: 0.8;">New Blog Post Published</p>
              </div>
              <div style="padding: 40px 30px; text-align: center;">
                <h2 style="margin: 0 0 20px; font-size: 28px; color: #111; line-height: 1.3;">${title}</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #666; margin-bottom: 30px;">
                  Hey! I've just published a new article in the <strong>${category}</strong> category.
                </p>
                <a href="${blogUrl}" style="display: inline-block; background-color: #ffa200; color: #ffffff; padding: 15px 35px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none;">
                  Read the Full Story
                </a>
              </div>
              <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; font-size: 14px; color: #999;">
                  You received this because you're subscribed to Naga Sai Teja's Blog.
                </p>
                <p style="margin: 15px 0 0;">
                  <a href="${unsubscribeUrl}" style="color: #ffa200; text-decoration: underline; font-size: 13px;">Unsubscribe</a>
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #bbb;">
              &copy; ${new Date().getFullYear()} Naga Sai Teja. All rights reserved.
            </div>
          </div>
        `;
        await sendEmail(
          sub.email,
          `New Post: ${title}`,
          `Hey! A new blog is live: ${title}. Read it here: ${blogUrl}`,
          emailHtml
        );
      }
    } catch (mailError) {
      console.error(`[${reqId}] Email sending failed:`, (mailError as Error).message);
    }

    return NextResponse.json({ success: true, data: newBlog });
  } catch (err) {
    console.error(`[${reqId}] Blog create failed:`, (err as Error).message);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
