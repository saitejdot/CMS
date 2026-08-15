import type { NextConfig } from "next";

/**
 * Security Headers
 *
 * Applied to all responses. Each header is documented with its purpose.
 *
 * CSP Notes:
 * - 'unsafe-inline' for script-src is required by Next.js 16's client-side
 *   hydration. Nonce-based CSP is supported in Next.js but requires additional
 *   middleware work; deferred to a future hardening phase.
 * - 'data:' in img-src is required by existing blog posts that store images
 *   as base64 data URIs. Will be removed after Phase 1B media migration.
 * - 'unsafe-inline' for style-src is required for Next.js inline styles and
 *   Tailwind CSS.
 *
 * HSTS:
 * - max-age=63072000 = 2 years. Only meaningful over HTTPS (Vercel prod).
 *   Does not affect local HTTP development.
 */

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for its hydration scripts.
      // TODO: Replace with nonce-based CSP in a future security hardening phase.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind and Next.js generate inline styles.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // data: required for existing base64 blog images — remove after media migration.
      // blob: required for video/media handling.
      "img-src 'self' data: blob:",
      // Video/audio elements
      "media-src 'self' blob: data:",
      // Fetch/XHR (same origin only)
      "connect-src 'self'",
      // No frames allowed
      "frame-ancestors 'none'",
      "frame-src 'none'",
      // No plugins
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
