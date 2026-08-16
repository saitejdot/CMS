"use client";

import { useState } from "react";

const LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian", "Japanese",
  "Korean", "Chinese (Simplified)", "Arabic", "Hindi", "Telugu", "Tamil",
  "Bengali", "Russian", "Dutch", "Polish", "Turkish", "Vietnamese", "Thai",
];

interface TranslationControlProps {
  slug: string;
  originalContent: string;
  onTranslated: (html: string | null) => void;
}

export default function TranslationControl({ slug, originalContent, onTranslated }: TranslationControlProps) {
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [translated, setTranslated] = useState(false);

  async function handleTranslate() {
    if (!language) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, language }),
      });

      const data = await res.json();
      if (data.success) {
        onTranslated(data.content);
        setTranslated(true);
      } else {
        setError("Translation failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    onTranslated(null);
    setTranslated(false);
    setLanguage("");
    setError("");
  }

  return (
    <div className="translation-control" aria-label="Story translation">
      {translated ? (
        <button onClick={handleReset} className="translation-reset-btn">
          ← Original English
        </button>
      ) : (
        <div className="translation-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 8l6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/>
            <path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>
          </svg>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="translation-select"
            aria-label="Select translation language"
            disabled={loading}
          >
            <option value="">Translate to...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button
            onClick={handleTranslate}
            disabled={!language || loading}
            className="translation-btn"
            aria-label={loading ? "Translating..." : "Translate story"}
          >
            {loading ? "Translating..." : "Translate"}
          </button>
        </div>
      )}
      {error && <p className="translation-error" role="alert">{error}</p>}
    </div>
  );
}
