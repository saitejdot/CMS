"use client";

import { useState, useEffect } from "react";

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

function parseRetryAfterSeconds(errorMessage: string): number | null {
  const match = errorMessage.match(/try again in\s+([0-9hms\.\s]+(?:s|m|h))/i);
  if (!match) return null;
  const timeStr = match[1];

  let totalSeconds = 0;
  const hMatch = timeStr.match(/(\d+)\s*h/i);
  const mMatch = timeStr.match(/(\d+)\s*m/i);
  const sMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*s/i);

  if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;
  if (sMatch) totalSeconds += Math.ceil(parseFloat(sMatch[1]));

  return totalSeconds > 0 ? totalSeconds : null;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TranslationControl({ slug, originalContent, onTranslated }: TranslationControlProps) {
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [translated, setTranslated] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState<number | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (retrySeconds === null || retrySeconds <= 0) return;

    const timer = setInterval(() => {
      setRetrySeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setError(""); // Clear error when timer expires
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retrySeconds]);

  async function handleTranslate() {
    if (!language || loading || (retrySeconds !== null && retrySeconds > 0)) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, language }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        onTranslated(data.content);
        setTranslated(true);
        setRetrySeconds(null);
      } else {
        const serverError = data?.error || `Translation failed (${res.status}). Please try again.`;
        
        // Developer logging: Output full error details in browser developer console
        console.error("[Translation API Error - Developer Console]:", {
          status: res.status,
          statusText: res.statusText,
          errorData: data,
          fullError: serverError,
        });

        // Parse retry time if present
        const parsedSeconds = parseRetryAfterSeconds(serverError);
        if (parsedSeconds) {
          setRetrySeconds(parsedSeconds);
          setError(`Please try after ${formatTime(parsedSeconds)}.`);
        } else if (res.status === 429 || serverError.toLowerCase().includes("rate limit")) {
          setError("Rate limit reached. Please try again after a few minutes.");
        } else {
          setError(serverError);
        }
      }
    } catch (err) {
      // Developer logging for network exceptions
      console.error("[Translation Component Exception]:", err);
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

  const isRateLimited = retrySeconds !== null && retrySeconds > 0;

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
            disabled={loading || isRateLimited}
          >
            <option value="">Translate to...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button
            onClick={handleTranslate}
            disabled={!language || loading || isRateLimited}
            className="translation-btn"
            aria-label={loading ? "Translating..." : isRateLimited ? `Try after ${formatTime(retrySeconds!)}` : "Translate story"}
          >
            {loading ? "Translating..." : isRateLimited ? `Wait ${formatTime(retrySeconds!)}` : "Translate"}
          </button>
        </div>
      )}
      {error && (
        <p className="translation-error" role="alert">
          {isRateLimited ? `Please try after ${formatTime(retrySeconds!)}` : error}
        </p>
      )}
    </div>
  );
}
