"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = "/admin";
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen flex flex-col items-center justify-center">
      <div className="mb-6">
        <BackButton />
      </div>
      <form
        onSubmit={handleLogin}
        className="p-6 border rounded space-y-4 w-full max-w-sm"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}
      >
        <h1 className="text-2xl font-bold">Admin Login</h1>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full input-pro rounded"
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 w-full rounded"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}