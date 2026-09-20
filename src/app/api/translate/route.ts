/**
 * POST /api/translate
 *
 * Translates a published Story's content to the requested language.
 *
 * Security:
 *   1. Rate limiting — 30 requests / minute / IP
 *   2. Validation — slug required, language whitelisted
 *   3. Only PUBLISHED stories are translatable
 *   4. Results cached in DB (Translation model) to avoid redundant AI calls
 *   5. AI API keys remain server-side
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import Translation from "@/models/Translation";
import { getTranslationProvider } from "@/lib/ai";
import { rateLimiters, getClientIP } from "@/lib/rateLimit";
import { generateRequestId } from "@/lib/requestId";

const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian", "Japanese",
  "Korean", "Chinese (Simplified)", "Arabic", "Hindi", "Telugu", "Tamil",
  "Bengali", "Russian", "Dutch", "Polish", "Turkish", "Vietnamese", "Thai",
] as const;

type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

const TranslateSchema = z.object({
  slug: z.string().min(1).max(200),
  language: z.enum(SUPPORTED_LANGUAGES),
});

export async function POST(request: Request) {
  const reqId = generateRequestId();

  try {
    // 1. Rate limiting
    try {
      const ip = getClientIP(request);
      const rl = await rateLimiters.interact.limit(ip);
      if (!rl.success) {
        return NextResponse.json({ success: false, error: "Too many requests. Please wait a minute." }, { status: 429 });
      }
    } catch (rlErr) {
      console.warn(`[${reqId}] Rate limiter warning (degraded mode):`, (rlErr as Error).message);
    }

    // 2. Parse and validate
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const parsed = TranslateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid input parameters" }, { status: 400 });
    }

    const { slug, language } = parsed.data;

    await connectDB();

    // 3. Fetch the PUBLISHED story
    const story = await Story.findOne({ slug, status: "PUBLISHED" }).select("_id content").lean() as { _id: string; content: string } | null;

    if (!story) {
      return NextResponse.json({ success: false, error: "Story not found or not published" }, { status: 404 });
    }

    // 4. Check cache
    const cached = await Translation.findOne({ storyId: story._id, language }).lean() as { translatedContent: string } | null;
    if (cached) {
      console.log(`[${reqId}] Translation cache hit: ${slug} → ${language}`);
      return NextResponse.json({ success: true, content: cached.translatedContent, cached: true });
    }

    // 5. Translate
    const translator = getTranslationProvider();
    const translated = await translator.translate(story.content, language);

    // 6. Cache result
    await Translation.findOneAndUpdate(
      { storyId: story._id, language },
      { storyId: story._id, language, translatedContent: translated },
      { upsert: true, new: true }
    );

    console.log(`[${reqId}] Translation completed: ${slug} → ${language}`);
    return NextResponse.json({ success: true, content: translated, cached: false });
  } catch (err) {
    const errorMsg = (err as Error).message || "Translation failed. Please try again.";
    console.error(`[${reqId}] Translation error:`, errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}
