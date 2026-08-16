import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import LikeButton from "@/components/LikeButton";
import ViewTracker from "@/components/ViewTracker";
import SubscribeForm from "@/components/SubscribeForm";
import ContactSection from "@/components/ContactSection";
import StoryReader from "@/components/StoryReader";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await connectDB();
    const { slug } = await params;
    const story = await Story.findOne({ slug, status: "PUBLISHED" }).lean() as { title: string; content: string } | null;
    if (!story) return { title: "Story Not Found" };
    const description = (story.content ?? "").replace(/<[^>]*>/g, "").slice(0, 160);
    return {
      title: `${story.title} — Naga Sai Teja`,
      description,
      openGraph: {
        title: story.title,
        description,
        type: "article",
      },
    };
  } catch {
    return { title: "Story" };
  }
}

function calcReadingTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export default async function StoryPage({ params }: Props) {
  await connectDB();
  const { slug } = await params;

  const story = await Story.findOne({ slug, status: "PUBLISHED" }).lean() as {
    _id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    tags?: string[];
    coverImage?: string;
    likes: number;
    views: number;
    createdAt: Date;
  } | null;

  if (!story) return notFound();

  // Adjacent stories for prev/next
  const [prevStory, nextStory] = await Promise.all([
    Story.findOne({ status: "PUBLISHED", createdAt: { $lt: story.createdAt } })
      .sort({ createdAt: -1 })
      .select("title slug")
      .lean() as Promise<{ title: string; slug: string } | null>,
    Story.findOne({ status: "PUBLISHED", createdAt: { $gt: story.createdAt } })
      .sort({ createdAt: 1 })
      .select("title slug")
      .lean() as Promise<{ title: string; slug: string } | null>,
  ]);

  const readingTime = calcReadingTime(story.content);
  const publishedDate = new Date(story.createdAt).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* NOTEBOOK WRAPPER */}
        <div className="notebook-page">
          {/* HEADER */}
          <div className="notebook-header">
            {story.category && (
              <span className="story-category-pill">{story.category}</span>
            )}
            <h1 className="notebook-title">{story.title}</h1>
            <div className="notebook-meta">
              <span>{publishedDate}</span>
              <span>·</span>
              <span>{readingTime}</span>
            </div>
          </div>

          {/* COVER IMAGE */}
          {story.coverImage && (
            <div className="notebook-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.coverImage} alt={story.title} className="notebook-cover-img" />
            </div>
          )}

          {/* STORY READER — handles translation + content display */}
          <StoryReader slug={slug} originalContent={story.content} />

          {/* CLOSING */}
          <div className="notebook-closing">
            <div className="notebook-divider" />
            <p className="notebook-thanks">
              Thank you for reading. If this resonated with you, share it with someone who needs it.
            </p>
            <p className="notebook-signature">— Tej</p>
          </div>

          {/* ENGAGEMENT */}
          <div className="notebook-engagement">
            <LikeButton slug={slug} initialLikes={story.likes} />
            <ViewTracker slug={slug} initialViews={story.views || 0} />
          </div>

          {/* TAGS */}
          {story.tags && story.tags.length > 0 && (
            <div className="story-tags mt-6">
              {story.tags.map((tag, i) => (
                <span key={i} className="story-tag">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* SUBSCRIBE */}
        <div className="mt-12 card p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Enjoyed this story?</h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Get notified when I publish new content. No spam — just good writing.
          </p>
          <SubscribeForm />
        </div>

        {/* PREV / NEXT */}
        {(prevStory || nextStory) && (
          <nav className="mt-10 flex gap-4 justify-between text-sm" aria-label="Story navigation">
            {prevStory ? (
              <Link href={`/stories/${prevStory.slug}`} className="flex-1 card p-4 hover:border-accent transition">
                <span className="text-xs block mb-1" style={{ color: "var(--muted)" }}>← Previous</span>
                <span className="font-medium">{prevStory.title}</span>
              </Link>
            ) : <div className="flex-1" />}
            {nextStory ? (
              <Link href={`/stories/${nextStory.slug}`} className="flex-1 card p-4 text-right hover:border-accent transition">
                <span className="text-xs block mb-1" style={{ color: "var(--muted)" }}>Next →</span>
                <span className="font-medium">{nextStory.title}</span>
              </Link>
            ) : <div className="flex-1" />}
          </nav>
        )}
      </main>
      <ContactSection />
    </>
  );
}