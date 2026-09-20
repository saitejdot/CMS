"use client";

import { useEffect, useState } from "react";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("cms_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cms_visitor_id", id);
  }
  return id;
}

export default function ViewTracker({
  slug,
  initialViews,
}: {
  slug: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const visitorId = getVisitorId();
    fetch("/api/stories/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visitorId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setViews(data.views);
        }
      })
      .catch(() => {});
  }, [slug]);

  return (
    <span className="view-counter" title="Unique views">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{views} {views === 1 ? "view" : "views"}</span>
    </span>
  );
}
