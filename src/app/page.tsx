import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import Subscriber from "@/models/Subscriber";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import ContactSection from "@/components/ContactSection";
import { formatDateIST, stripHtml } from "@/utils/date";
import StoryCarousel from "@/components/StoryCarousel";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let blogs: { _id: string; title: string; slug: string; createdAt: Date; content: string }[] = [];
  let subscriberCount = 0;

  try {
    await connectDB();
    // Get latest 3 blogs directly from DB
    blogs = await Blog.find().sort({ createdAt: -1 }).limit(3).lean();
    subscriberCount = await Subscriber.countDocuments();
  } catch (error) {
    console.error("Home page DB error:", error);
    // Keep blogs as empty array so page doesn't crash
  }

  return (
    <>
      <main className="max-w-4xl mx-auto p-4">

        {/* 🔵 STORY CAROUSEL */}
        <StoryCarousel />

        {/* SUBSCRIBER COUNT — right-aligned pill below the banner */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 4 }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--muted)",
            letterSpacing: "0.02em",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {subscriberCount.toLocaleString()} {subscriberCount === 1 ? "subscriber" : "subscribers"}
          </span>
        </div>

        {/* 🟢 PROFILE */}
        <div className="px-6 relative">
          <div className="absolute -top-16 left-6">
            <div className="w-44 h-44 rounded-full border-4 shadow-lg overflow-hidden"
              style={{
                borderColor: "var(--bg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/profile.jpeg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>




          </div>
          <div className="pt-32 md:pt-32">
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }} >Naga Sai Teja Bollimuntha...</h1>
            <p className="text-gray-350">
              Building things || learning daily || chasing growth
            </p>
          </div>

          {/* ABOUT */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>About</h2>
            <p className="text-gray-350 mt-2">
              Who am I? To define is to limit.

            </p>
          </div>

          {/* recent blogs */}

          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Latest Blogs</h2>

            <div className="space-y-4">
              {blogs.length > 0 ? (
                blogs.map((blog) => (
                  <div key={blog._id} className="card p-4 shadow-sm">
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="text-lg font-semibold text-accent hover:underline">
                        {blog.title}
                      </h3>
                    </Link>

                    <p className="text-sm text-muted inline-flex items-center gap-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      {formatDateIST(blog.createdAt)}
                    </p>

                    <p className="mt-2 text-muted">
                      {stripHtml(blog.content).slice(0, 100)}...
                    </p>
                  </div>
                ))
              ) : (
                /* Ghost placeholder cards — space reserved for future posts */
                [0, 1, 2].map((i) => (
                  <div key={i} className="card p-4 shadow-sm" style={{ opacity: 0.45 }}>
                    {/* Title placeholder */}
                    <div className="h-4 rounded mb-3" style={{
                      width: i === 0 ? "60%" : i === 1 ? "75%" : "50%",
                      backgroundColor: "var(--border)"
                    }} />
                    {/* Date placeholder */}
                    <div className="h-3 rounded mb-3" style={{
                      width: "25%",
                      backgroundColor: "var(--border)"
                    }} />
                    {/* Excerpt placeholder lines */}
                    <div className="space-y-2">
                      <div className="h-3 rounded" style={{ width: "100%", backgroundColor: "var(--border)" }} />
                      <div className="h-3 rounded" style={{ width: "85%", backgroundColor: "var(--border)" }} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <Link href="/blogs" className="text-accent hover:underline">
                View All Blogs →
              </Link>
            </div>
          </div>

          {/* Subscribe form */}
          <div className="mt-12 card p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Subscribe to my blog
            </h2>

            <p className="text-sm text-muted mb-4">
              Get notified when I publish new content.
              - just in case you need another reason to question your life choices.
            </p>

            <SubscribeForm />
          </div>




        </div>
      </main>
      <ContactSection />
    </>
  );
}