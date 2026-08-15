# CMS v2: PRODUCTION ARCHITECTURE SPECIFICATION

This document outlines the target architecture for CMS v2, incorporating production-scale engineering requirements designed for Vercel, MongoDB, and Cloudflare.

---

## 1. Core Principles
* **Serverless-Native:** Designed for Vercel's ephemeral environments. No reliance on local disk or permanent in-memory state.
* **Stateless Scaling:** Connection pooling for MongoDB, stateless authentication (JWT).
* **Graceful Degradation:** External service failures (AI, Email, Media) must not crash the core application.
* **Separation of Concerns:** Content storage (MongoDB) is decoupled from Media storage (Cloudflare) and Email delivery (Transactional API).
* **Security by Default:** All APIs protected, rate-limited, and content sanitized.

## 2. Infrastructure & External Services
* **Hosting:** Vercel (Next.js App Router).
* **Database:** MongoDB Atlas (Mongoose).
* **Media Delivery (Images):** Cloudflare Images.
* **Media Delivery (Video):** Cloudflare Stream.
* **Email Delivery:** Asynchronous Transactional Service (e.g., Resend).
* **Rate Limiting / Cache:** Upstash Redis (Serverless Redis) for distributed rate-limiting across Vercel edge functions.
* **AI Provider:** (Configurable) Anthropic/OpenAI for Translation and "Ask Tej".

## 3. Data Storage & Schema Enhancements
* **Blogs:** Add indexes on `slug`, `createdAt`, and `category`. Extract all Base64 strings.
* **Projects:** New schema (title, slug, status, order).
* **Translations:** New schema linked via `storyId` and `language`. Unique compound index.
* **Subscribers:** Enforce strict unique index on `email`.

## 4. Security & Authentication
* **Admin Auth:** Stateless JWT stored in a secure, HTTP-only, SameSite=Lax cookie.
* **Authorization:** Next.js Middleware enforces the cookie on all `/admin` routes and protected `/api` routes.
* **Content Security Policy (CSP):** Strict CSP blocking inline scripts and unauthorized frame sources.
* **Sanitization:** All rich-text HTML is server-side sanitized before being committed to MongoDB.

## 5. Performance & Caching
* **Public Content:** Uses Next.js Incremental Static Regeneration (ISR). Pages are cached at the edge.
* **Revalidation:** Admin mutations trigger on-demand revalidation (`revalidateTag` / `revalidatePath`) for affected pages.
* **Pagination:** Cursor-based or standard limit/skip pagination for all list APIs (Blogs, Subscribers). Unbounded arrays are strictly prohibited.

## 6. Media Pipeline
1. Editor requests a signed upload URL from the server.
2. Server validates admin session and generates a direct-upload URL (Cloudflare).
3. Client uploads directly to Cloudflare, bypassing Vercel payload limits.
4. Cloudflare returns the CDN URL, which is embedded in the editor.

## 7. Email Pipeline
1. Admin publishes a blog.
2. Server updates MongoDB and triggers `revalidatePath`.
3. Server drops an asynchronous job onto an external Queue/Provider (e.g., Resend/Upstash QStash).
4. Vercel function completes. Emails are delivered asynchronously in the background.

## 8. Rate Limiting Strategy
* Implemented via Upstash Redis.
* **Public Mutations (Subscribe, Like):** Strict limits (e.g., 5 requests / 15 minutes per IP).
* **AI Endpoints (Ask Tej):** Very strict limits, max token bounds.
* **Admin Auth:** Brute-force protection on the login endpoint.
