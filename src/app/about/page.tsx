import { connectDB } from "@/lib/db";
import PageContent from "@/models/PageContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Naga Sai Teja",
  description: "Learn about Naga Sai Teja — developer, fitness enthusiast, and lifelong learner.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  let content = "<p>Content coming soon.</p>";
  let title = "About Me";

  try {
    await connectDB();
    const page = await PageContent.findOne({ pageId: "about" }).lean() as { title: string; content: string } | null;
    if (page) {
      title = page.title;
      content = page.content;
    }
  } catch (err) {
    console.error("About page error:", err);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h1>
      <div className="h-1 w-12 rounded mb-8" style={{ backgroundColor: "var(--accent)" }} />

      <article
        className="story-content prose-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </main>
  );
}
