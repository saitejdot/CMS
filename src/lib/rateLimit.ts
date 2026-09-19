/**
 * Centralised rate-limiting configuration using Upstash Redis.
 *
 * All limits are defined in ONE place. Changing a limit requires editing
 * only this file — no changes to individual route handlers.
 *
 * Usage in a route handler:
 *   const ip = getClientIP(request);
 *   const result = await rateLimiters.login.limit(ip);
 *   if (!result.success) {
 *     return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *   }
 *
 * Upstash Redis is used because Vercel functions are stateless — process-memory
 * maps reset on every cold start and do not share state across instances or
 * regions. Upstash provides a serverless-compatible persistent store.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ---------------------------------------------------------------------------
// Redis client (singleton pattern compatible with serverless)
// ---------------------------------------------------------------------------

function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
    );
  }

  return new Redis({ url, token });
}

// ---------------------------------------------------------------------------
// Rate limit definitions — edit here to change limits
// ---------------------------------------------------------------------------

const LIMITS = {
  login: { requests: 5, window: "15 m" },
  subscribe: { requests: 3, window: "1 h" },
  interact: { requests: 30, window: "1 m" },
  adminMediaAuth: { requests: 30, window: "10 m" },
} as const;

// ---------------------------------------------------------------------------
// Lazily-initialised limiters (avoids instantiating Redis on import)
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;

function redis(): Redis {
  if (!_redis) _redis = getRedis();
  return _redis;
}

function makeLimiter(key: keyof typeof LIMITS): Ratelimit {
  const { requests, window } = LIMITS[key];
  return new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `cms:rl:${key}`,
  });
}

// Exported limiters — one per endpoint group
export const rateLimiters = {
  login: makeLimiter("login"),
  subscribe: makeLimiter("subscribe"),
  interact: makeLimiter("interact"),
  adminMediaAuth: makeLimiter("adminMediaAuth"),
};

// ---------------------------------------------------------------------------
// Helper: extract the best available client IP from a request
// ---------------------------------------------------------------------------

export function getClientIP(request: Request): string {
  // Vercel forwards the real IP in x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  // Fallback — should not happen in production
  return "unknown";
}
