"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
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

export default function AskTej() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      } else {
        const serverError = data?.error || `Request failed (${res.status}). Please try again.`;

        // Developer logging: Output full raw error to browser console
        console.error("[Chat API Error - Developer Console]:", {
          status: res.status,
          statusText: res.statusText,
          errorData: data,
          fullError: serverError,
        });

        // Parse retry duration for friendly user display
        const parsedSeconds = parseRetryAfterSeconds(serverError);
        let userMessage = "";
        if (parsedSeconds) {
          userMessage = `Rate limit reached. Please try after ${formatTime(parsedSeconds)}.`;
        } else if (res.status === 429 || serverError.toLowerCase().includes("rate limit")) {
          userMessage = "Rate limit reached. Please try again after a few minutes.";
        } else {
          userMessage = "Sorry, something went wrong. Please try again.";
        }

        setMessages([...newMessages, { role: "assistant", content: userMessage }]);
      }
    } catch (err) {
      console.error("[Chat Component Exception]:", err);
      setMessages([...newMessages, { role: "assistant", content: "Network error. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        id="ask-tej-btn"
        onClick={() => setOpen(!open)}
        aria-label="Ask Tej AI"
        className="ask-tej-fab"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="ask-tej-window" role="dialog" aria-label="Ask Tej AI chat">
          {/* HEADER */}
          <div className="ask-tej-header">
            <div className="ask-tej-avatar">T</div>
            <div>
              <div className="ask-tej-name">Ask Tej</div>
              <div className="ask-tej-status">AI assistant · Answers about Tej</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="ask-tej-close"
            >
              ✕
            </button>
          </div>

          {/* MESSAGES */}
          <div className="ask-tej-messages" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="ask-tej-intro">
                <p>👋 Hi! Ask me anything about Tej — his career, projects, writing, skills, or what he&apos;s up to.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`ask-tej-msg ${msg.role}`}>
                <span>{msg.content}</span>
              </div>
            ))}
            {loading && (
              <div className="ask-tej-msg assistant">
                <span className="ask-tej-typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div className="ask-tej-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask something about Tej..."
              maxLength={500}
              aria-label="Chat message"
              className="ask-tej-input"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="ask-tej-send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
