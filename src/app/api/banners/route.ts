import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4"]);

export interface BannerItem {
  src: string;
  type: "image" | "video";
}

function getBannersFromDir(dirPath: string, prefix: string): BannerItem[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const items: { num: number; item: BannerItem }[] = [];

  for (const file of files) {
    const dotIndex = file.lastIndexOf(".");
    if (dotIndex === -1) continue;

    const nameWithoutExt = file.slice(0, dotIndex);
    const ext = file.slice(dotIndex + 1).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    const num = parseInt(nameWithoutExt, 10);
    if (
      isNaN(num) ||
      num <= 0 ||
      String(num) !== nameWithoutExt
    ) {
      continue;
    }

    items.push({
      num,
      item: {
        src: `${prefix}${file}`,
        type: ext === "mp4" ? "video" : "image",
      },
    });
  }

  items.sort((a, b) => a.num - b.num);
  return items.map((i) => i.item);
}

export async function GET() {
  try {
    const desktopDir = path.join(process.cwd(), "public", "banners", "desktop");
    const mobileDir = path.join(process.cwd(), "public", "banners", "mobile");

    const desktop = getBannersFromDir(desktopDir, "/banners/desktop/");
    const mobile = getBannersFromDir(mobileDir, "/banners/mobile/");

    return NextResponse.json({ desktop, mobile });
  } catch (err) {
    console.error("[/api/banners] Error reading banners directory:", err);
    return NextResponse.json({ desktop: [], mobile: [] });
  }
}
