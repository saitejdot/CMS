"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ContactSection from "@/components/ContactSection";
import { formatDateIST, stripHtml } from "@/utils/date";
import type { Metadata } from "next";

interface Story {
  _id: string;
  title: string;
  slug: string;
  category: string;
  createdAt: string;
  content: string;
  likes: number;
  views: number;
}

const CATEGORIES = ["all", "Tech", "Life", "Fitness", "Motivation", "Thoughts", "Philosophies", "Other"];

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStories(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = stories
    .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => (category === "all" ? true : s.category === category))
    .sort((a, b) =>
      sort === "latest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Stories
        </h1>
        <p className="mb-8" style={{ color: "var(--muted)" }}>
          Writing on tech, life, fitness, and everything in between.
        </p>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <input
            placeholder="Search stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 rounded input-pro"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 rounded input-pro"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="p-2 rounded input-pro"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* LIST */}
        <div className="space-y-5">
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 rounded w-2/3 mb-3" style={{ backgroundColor: "var(--border)" }} />
                <div className="h-3 rounded w-1/4 mb-4" style={{ backgroundColor: "var(--border)" }} />
                <div className="h-3 rounded w-full mb-2" style={{ backgroundColor: "var(--border)" }} />
                <div className="h-3 rounded w-5/6" style={{ backgroundColor: "var(--border)" }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--muted)" }}>
              <p className="text-lg font-semibold">No stories found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            filtered.map((story) => (
              <article key={story._id} className="card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/stories/${story.slug}`}>
                      <h2 className="text-xl font-semibold text-accent hover:underline mb-1">
                        {story.title}
                      </h2>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 text-xs mb-3" style={{ color: "var(--muted)" }}>
                      <span>{formatDateIST(story.createdAt)}</span>
                      {story.category && (
                        <span
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--border)", color: "var(--muted)" }}
                        >
                          {story.category}
                        </span>
                      )}
                      <span>❤ {story.likes}</span>
                      <span>👁 {story.views || 0}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {stripHtml(story.content).slice(0, 150)}...
                    </p>
                  </div>
                </div>
                <Link
                  href={`/stories/${story.slug}`}
                  className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
                >
                  Read more →
                </Link>
              </article>
            ))
          )}
        </div>
      </main>
      <ContactSection />
    </>
  );
}