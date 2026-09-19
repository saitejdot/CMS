import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import PageContent from "@/models/PageContent";
import { connectDB } from "@/lib/db";
import { z } from "zod";

const PageContentSchema = z.object({
  pageId: z.string().min(1, "Page ID is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  metadata: z.any().optional(),
});

export async function GET(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");
    
    await connectDB();
    
    if (pageId) {
      const page = await PageContent.findOne({ pageId }).lean();
      return NextResponse.json({ success: true, data: page });
    }
    
    const pages = await PageContent.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: pages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const body = await req.json();
    const parsed = PageContentSchema.parse(body);

    await connectDB();
    
    // Upsert the page content (create if not exists, otherwise update)
    const page = await PageContent.findOneAndUpdate(
      { pageId: parsed.pageId },
      parsed,
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: page });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
