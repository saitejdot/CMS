import { connectDB } from "@/lib/db";
import PageContent from "@/models/PageContent";
import type { Metadata } from "next";
import { formatDateIST } from "@/utils/date";

export const metadata: Metadata = {
  title: "Now — Naga Sai Teja",
  description: "What Naga Sai Teja is currently doing, learning, and thinking about.",
};

export const dynamic = "force-dynamic";

export default async function NowPage() {
  let content = "<p>Check back soon — this page is being set up.</p>";
  let title = "What I'm Doing Now";
  let updatedAt: Date | null = null;

  try {
    await connectDB();
    const page = await PageContent.findOne({ pageId: "now" }).lean() as { title: string; content: string; updatedAt: Date } | null;
    if (page) {
      title = page.title;
      content = page.content;
      updatedAt = page.updatedAt;
    }
  } catch (err) {
    console.error("Now page error:", err);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h1>
      <div className="h-1 w-12 rounded mb-4" style={{ backgroundColor: "var(--accent)" }} />
      {updatedAt && (
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Last updated: {formatDateIST(updatedAt)}
        </p>
      )}

      <article
        className="story-content prose-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <p className="mt-12 text-xs" style={{ color: "var(--muted)" }}>
        This is a <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className="underline">Now page</a>. 
        It&apos;s a snapshot of what I&apos;m focused on at this point in my life.
      </p>
    </main>
  );
}
