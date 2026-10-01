"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "rate_limited">("idle");

  const handleSubscribe = async () => {
    if (!email || !name) return;

    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setName("");
        setEmail("");
      } else if (data.error === "rate_limited") {
        setStatus("rate_limited");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return (
      <p className="text-accent font-medium text-sm">
        🎉 You&apos;re in! Thanks for subscribing. You can always unsubscribe later.
      </p>
    );
  }

  if (status === "rate_limited") {
    return (
      <p className="text-yellow-500 font-medium text-sm">
        ⏳ Too many attempts from your network. Please try again in an hour.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full bg-transparent input-pro subscribe-input"
      />
      <input
        type="email"
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full bg-transparent input-pro subscribe-input"
      />
      {status === "error" && (
        <p className="text-red-500 text-xs">Something went wrong. Please check your details and try again.</p>
      )}
      <button
        onClick={handleSubscribe}
        className="bg-black text-white px-4 py-2 rounded w-full"
        disabled={loading || !name || !email}
      >
        {loading ? "Subscribing..." : "Subscribe"}
      </button>
    </div>
  );
}