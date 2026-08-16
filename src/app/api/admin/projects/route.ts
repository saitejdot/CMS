import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import Project from "@/models/Project";
import { connectDB } from "@/lib/db";
import { z } from "zod";

const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  content: z.string().min(1, "Content is required"),
  technologies: z.array(z.string()).default([]),
  coverImage: z.string().optional(),
  githubUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "TRASH"]).default("DRAFT"),
});

export async function GET(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  await connectDB();
  const projects = await Project.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: projects });
}

export async function POST(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const body = await req.json();
    const parsed = ProjectSchema.parse(body);

    await connectDB();
    const newProject = await Project.create(parsed);

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const body = await req.json();
    const { _id, ...updateData } = body;
    
    if (!_id) return NextResponse.json({ success: false, error: "Missing _id" }, { status: 400 });

    const parsed = ProjectSchema.partial().parse(updateData);

    await connectDB();
    const updated = await Project.findByIdAndUpdate(_id, parsed, { new: true });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    await connectDB();
    await Project.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
