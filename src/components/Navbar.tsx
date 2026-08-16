"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="logo">
  Naga Sai Teja
</Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-yellow-500 transition">Home</Link>
            <Link href="/about" className="hover:text-yellow-500 transition">About</Link>
            <Link href="/now" className="hover:text-yellow-500 transition">Now</Link>
            <Link href="/career" className="hover:text-yellow-500 transition">Career</Link>
            <Link href="/stories" className="hover:text-yellow-500 transition">Stories</Link>
            <Link href="/contact" className="hover:text-yellow-500 transition">Contact</Link>

          <ThemeToggle />
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-xl"
          style={{ color: "var(--text)" }}
        >
          ☰
        </button>
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-64 transform transition-transform duration-300 z-50 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--card)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="p-4 space-y-6">
          
          {/* CLOSE BUTTON */}
          <button
            onClick={() => setOpen(false)}
            className="text-xl"
            style={{ color: "var(--text)" }}
          >
            ✕
          </button>

          {/* NAV LINKS */}
          <nav className="flex flex-col gap-5 text-lg">
            <Link href="/" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>Home</Link>
            <Link href="/about" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>About</Link>
            <Link href="/now" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>Now</Link>
            <Link href="/career" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>Career</Link>
            <Link href="/stories" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>Stories</Link>
            <Link href="/contact" onClick={() => setOpen(false)} style={{ color: "var(--text)" }}>Contact</Link>

            <div className="pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>

      {/* BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
        />
      )}
    </nav>
  );
}