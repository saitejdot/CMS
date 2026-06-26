"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ContactSection from "@/components/ContactSection";
import BackButton from "@/components/BackButton";
import { formatDateIST, stripHtml } from "@/utils/date";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
  content: string;
  likes: number;
  views: number;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();

      if (data.success) {
        setBlogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // 🔍 FILTER LOGIC
  const filteredBlogs = blogs
    .filter((blog) =>
      blog.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((blog) =>
      category === "all" ? true : blog.category === category
    )
    .sort((a, b) =>
      sort === "latest"
        ? new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
    );

  return (
   <>
   <main className="max-w-4xl mx-auto p-6 space-y-6">
  <BackButton />

  <h1 className="text-3xl font-bold">All Blogs</h1>

  <input
    placeholder="Search blogs..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full p-3 rounded-lg text-[var(--text)] input-pro"
  />

  <div className="flex flex-col md:flex-row gap-4">
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="p-2 rounded-lg text-[var(--text)] input-pro"
    >
      <option value="all">All</option>
      <option value="tech">Tech</option>
      <option value="fitness">Fitness</option>
      <option value="life">Life</option>
      <option value="motivation">Motivation</option>
    </select>

    <select
      value={sort}
      onChange={(e) => setSort(e.target.value)}
      className="p-2 rounded-lg text-[var(--text)] input-pro"
    >
      <option value="latest">Latest</option>
      <option value="oldest">Oldest</option>
    </select>
  </div>

  <div className="space-y-4">
    {isLoading ? (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 rounded-full animate-spin border-t-transparent" style={{ borderColor: 'var(--muted)', borderTopColor: 'var(--text)' }}></div>
        <p className="mt-4 font-medium animate-pulse" style={{ color: 'var(--text)', fontFamily: "var(--font-heading)" }}>Loading blogs...</p>
      </div>
    ) : filteredBlogs.length === 0 ? (
      <div className="text-center py-16" style={{ color: "var(--muted)" }}>
        {/* Outlined empty-inbox illustration */}
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-5"
          style={{ width: 56, height: 56, opacity: 0.55 }}
          aria-hidden="true"
        >
          {/* Box base */}
          <path d="M8 36h48l-6 16H14L8 36Z" />
          {/* Box top open */}
          <path d="M8 36l8-20h32l8 20" />
          {/* Divider */}
          <path d="M8 36h48" />
          {/* Empty slot lines inside box */}
          <path d="M24 44h16" />
        </svg>
        <p className="text-base font-semibold">No posts yet</p>
        <p className="text-sm mt-1">Check back soon — content is coming!</p>
      </div>
    ) : (
      filteredBlogs.map((blog) => (
        <div key={blog._id} className="card p-4 shadow-sm">
          <Link href={`/blog/${blog.slug}`}>
            <h2 className="text-xl font-semibold text-accent hover:underline">
              {blog.title}
            </h2>
          </Link>

          <div className="blog-card-meta">
            <p className="text-sm text-muted inline-flex items-center gap-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatDateIST(blog.createdAt)}
            </p>
            <span className="text-sm text-muted inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> {blog.likes}</span>
            <span className="text-sm text-muted inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> {blog.views || 0}</span>
          </div>

          <p className="mt-2 text-muted">
            {stripHtml(blog.content).slice(0, 120)}...
          </p>
        </div>
      ))
    )}
  </div>
</main>
<ContactSection />
</>
  );
}