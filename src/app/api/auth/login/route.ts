import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password === process.env.ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true });

      response.cookies.set("admin", "true", {
        httpOnly: true,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}