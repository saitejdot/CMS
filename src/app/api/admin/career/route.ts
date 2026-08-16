import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import Career from "@/models/Career";
import { connectDB } from "@/lib/db";
import { z } from "zod";

const CareerSchema = z.object({
  type: z.enum(["experience", "education", "certification", "achievement"]),
  title: z.string().min(1, "Title is required"),
  organization: z.string().min(1, "Organization is required"),
  location: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  url: z.string().optional(),
  skills: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export async function GET(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  await connectDB();
  const careerItems = await Career.find().sort({ order: 1, startDate: -1 }).lean();
  return NextResponse.json({ success: true, data: careerItems });
}

export async function POST(req: Request) {
  const principal = await requireAdmin();
  if (principal instanceof NextResponse) return principal;

  try {
    const body = await req.json();
    const parsed = CareerSchema.parse(body);

    await connectDB();
    const newItem = await Career.create(parsed);

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
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

    const parsed = CareerSchema.partial().parse(updateData);

    await connectDB();
    const updated = await Career.findByIdAndUpdate(_id, parsed, { new: true });

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
    await Career.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
