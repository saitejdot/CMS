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
  // Red heart = user has ever clicked like on this post on this browser
  const [hasLiked, setHasLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Restore heart colour from localStorage on mount
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("cms_liked_posts") || "[]");
    if (likedPosts.includes(slug)) setHasLiked(true);
  }, [slug]);

  const handleLike = async () => {
    const visitorId = getVisitorId();

    // Optimistic update
    setLikes((prev) => prev + 1);
    setHasLiked(true);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 600);

    // Persist red heart in localStorage
    const likedPosts: string[] = JSON.parse(localStorage.getItem("cms_liked_posts") || "[]");
    if (!likedPosts.includes(slug)) {
      likedPosts.push(slug);
      localStorage.setItem("cms_liked_posts", JSON.stringify(likedPosts));
    }

    // Fire-and-forget to server
    fetch("/api/stories/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visitorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setLikes(data.likes);
      })
      .catch(() => {});
  };

  return (
    <button
      onClick={handleLike}
      className={`like-button ${hasLiked ? "liked" : ""} ${animating ? "like-pop" : ""}`}
      aria-label="Like this post"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        className="like-heart-icon"
        fill={hasLiked ? "#e5383b" : "none"}
        stroke={hasLiked ? "#e5383b" : "currentColor"}
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