import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checkCSRF } from "@/lib/csrf";
import { rateLimiters, getClientIP } from "@/lib/rateLimit";

const AuthMediaSchema = z.object({
  type: z.enum(["image", "video"]),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().max(10 * 1024 * 1024).optional(), // Max 10MB limit (applies to image right now, but optional for video if we don't have exact size yet)
});

export async function POST(request: Request) {
  // 1. JWT verification
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  // 2. Rate limiting
  const ip = getClientIP(request);
  const rl = await rateLimiters.adminMediaAuth.limit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 3. CSRF verification
  const csrfError = checkCSRF(request);
  if (csrfError) return csrfError;

  // 4. Body validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = AuthMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed" }, { status: 400 });
  }

  const { type, mimeType, sizeBytes } = parsed.data;

  // Additional limits check
  if (type === "image") {
    if (!mimeType.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Invalid image mime type" }, { status: 400 });
    }
    if (sizeBytes && sizeBytes > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Image size exceeds 10MB limit" }, { status: 413 });
    }
  } else if (type === "video") {
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json({ success: false, error: "Invalid video mime type" }, { status: 400 });
    }
    // We can define a conservative video size limit for the personal story, e.g., 200MB.
    if (sizeBytes && sizeBytes > 200 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Video size exceeds 200MB limit" }, { status: 413 });
    }
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error("Cloudflare credentials missing");
    return NextResponse.json({ success: false, error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    let uploadUrl = "";
    let providerId = ""; // Optional: Cloudflare might return id beforehand

    if (type === "image") {
      const fd = new FormData();
      // Our application intentionally uses a short 5-minute upload URL expiry.
      const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      fd.append("requireSignedURLs", "false"); // We want public delivery URLs
      fd.append("expiry", expiry);
      
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`
        },
        body: fd
      });

      if (!res.ok) {
        throw new Error(`Cloudflare Images Error: ${res.statusText}`);
      }
      const data = await res.json();
      uploadUrl = data.result.uploadURL;
      providerId = data.result.id;
    } else if (type === "video") {
      const fd = new FormData();
      // Our application intentionally uses a short 5-minute upload URL expiry.
      const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      fd.append("maxDurationSeconds", "3600"); // 1 hour max
      fd.append("expiry", expiry);
      // Ensure the video can be viewed publicly without signed URLs
      fd.append("requireSignedURLs", "false"); 

      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiToken}`
        },
        body: fd
      });

      if (!res.ok) {
        throw new Error(`Cloudflare Stream Error: ${res.statusText}`);
      }
      const data = await res.json();
      uploadUrl = data.result.uploadURL;
      providerId = data.result.uid;
    }

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        providerId
      }
    });

  } catch (error) {
    console.error("Failed to generate upload URL:", error);
    return NextResponse.json({ success: false, error: "Failed to communicate with media provider" }, { status: 502 });
  }
}
