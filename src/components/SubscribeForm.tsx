"use client";

import { useState } from "react";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email) return;

    setLoading(true);

    const res = await fetch("/api/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Thanks! Remember you always have a choice to unsubscribe.");
      setEmail("");
    } else {
      alert("relax, you already exist in my database.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 justify-center w-full">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full md:w-80 bg-transparent input-pro subscribe-input"
      />

      <button
        onClick={handleSubscribe}
        className="bg-black text-white px-4 py-2 rounded w-full md:w-auto"
        disabled={loading}
      >
        {loading ? "..." : "Subscribe"}
      </button>
    </div>
  );
}