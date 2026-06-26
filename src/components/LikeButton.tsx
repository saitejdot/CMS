"use client";

import { useState, useEffect } from "react";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("cms_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cms_visitor_id", id);
  }
  return id;
}

export default function LikeButton({
  slug,
  initialLikes,
}: {
  slug: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const likedPosts = JSON.parse(
      localStorage.getItem("cms_liked_posts") || "[]"
    );
    if (likedPosts.includes(slug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiked(true);
    }
  }, [slug]);

  const handleToggleLike = async () => {
    const visitorId = getVisitorId();

    // Optimistic UI update
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((prev) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));

    if (!wasLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }

    const res = await fetch("/api/blog/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visitorId }),
    });

    const data = await res.json();

    if (data.success) {
      setLikes(data.likes);
      setLiked(data.liked);

      // Sync localStorage
      const likedPosts: string[] = JSON.parse(
        localStorage.getItem("cms_liked_posts") || "[]"
      );
      if (data.liked) {
        if (!likedPosts.includes(slug)) {
          likedPosts.push(slug);
        }
      } else {
        const idx = likedPosts.indexOf(slug);
        if (idx > -1) likedPosts.splice(idx, 1);
      }
      localStorage.setItem("cms_liked_posts", JSON.stringify(likedPosts));
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      className={`like-button ${liked ? "liked" : ""} ${animating ? "like-pop" : ""}`}
      aria-label={liked ? "Unlike this post" : "Like this post"}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        className="like-heart-icon"
        fill={liked ? "#e5383b" : "none"}
        stroke={liked ? "#e5383b" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className="like-count">{likes}</span>
    </button>
  );
}