import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import LikeButton from "@/components/LikeButton";
import ViewTracker from "@/components/ViewTracker";
import BackButton from "@/components/BackButton";
import SubscribeForm from "@/components/SubscribeForm";
import ContactSection from "@/components/ContactSection";
import { formatDateTimeIST } from "@/utils/date";

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  await connectDB();

  const { slug } = await params;

  const blog = await Blog.findOne({ slug });

  if (!blog) {
    return <h1 className="p-10 text-xl">Blog not found</h1>;
  }

  return (
    <>
    <main className="max-w-3xl mx-auto p-10">
      {/* Back Button */}
      <BackButton />

      <h1 className="text-4xl font-bold mb-2 mt-6">
        {blog.title}
      </h1>

      <div className="blog-meta-row">
        <p className="text-muted text-sm inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {formatDateTimeIST(blog.createdAt)}
        </p>
        <ViewTracker slug={slug} initialViews={blog.views || 0} />
      </div>

      {/* Blog Content — rendered as rich HTML */}
      <div
        className="blog-content"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      <div className="mt-8 text-sm text-blue-500">
        Category: {blog.category}
      </div>

      {blog.tags && blog.tags.length > 0 && (
        <div className="blog-tags">
          {blog.tags.map((tag: string, i: number) => (
            <span key={i} className="blog-tag">#{tag}</span>
          ))}
        </div>
      )}

      <LikeButton slug={slug} initialLikes={blog.likes} />

      {/* Subscribe Form — styled like home page */}
      <div className="mt-12 card p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">
          Subscribe to my blog
        </h2>
        <p className="text-sm text-muted mb-4">
          Get notified when I publish new content
        </p>
        <SubscribeForm />
      </div>
    </main>
    <ContactSection />
    </>
  );
}