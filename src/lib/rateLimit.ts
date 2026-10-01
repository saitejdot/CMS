/**
 * Centralised rate-limiting configuration using Upstash Redis.
 *
 * All limits are defined in ONE place. Changing a limit requires editing
 * only this file — no changes to individual route handlers.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set,
 * rate limiting is SKIPPED gracefully — the endpoints still work.
 * This prevents a missing env var from silently breaking views/likes.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ---------------------------------------------------------------------------
// Redis client (singleton, optional)
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;
let _redisChecked = false;

function getRedis(): Redis | null {
  if (_redisChecked) return _redis;
  _redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[rateLimit] Upstash env vars not set — rate limiting disabled.");
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ---------------------------------------------------------------------------
// Rate limit definitions
// ---------------------------------------------------------------------------

const LIMITS = {
  login:          { requests: 5,  window: "15 m" },
  subscribe:      { requests: 3,  window: "1 h"  },
  interact:       { requests: 30, window: "1 m"  },
  adminMediaAuth: { requests: 30, window: "10 m" },
} as const;

// ---------------------------------------------------------------------------
// Mock limiter — returned when Redis is unavailable
// Always allows requests through (no enforcement).
// ---------------------------------------------------------------------------

const MOCK_LIMITER = {
  limit: async (_id: string) => ({ success: true, limit: 999, remaining: 999, reset: 0 }),
};

// ---------------------------------------------------------------------------
// Lazily-initialised real limiters
// ---------------------------------------------------------------------------

const _limiters: Partial<Record<keyof typeof LIMITS, Ratelimit>> = {};

function getLimiter(key: keyof typeof LIMITS): { limit: (id: string) => Promise<{ success: boolean }> } {
  const redis = getRedis();
  if (!redis) return MOCK_LIMITER;

  if (!_limiters[key]) {
    const { requests, window } = LIMITS[key];
    _limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `cms:rl:${key}`,
    });
  }

  return _limiters[key]!;
}

// ---------------------------------------------------------------------------
// Exported rate limiters — same API as before
// ---------------------------------------------------------------------------

export const rateLimiters = {
  login:          { limit: (id: string) => getLimiter("login").limit(id) },
  subscribe:      { limit: (id: string) => getLimiter("subscribe").limit(id) },
  interact:       { limit: (id: string) => getLimiter("interact").limit(id) },
  adminMediaAuth: { limit: (id: string) => getLimiter("adminMediaAuth").limit(id) },
};

// ---------------------------------------------------------------------------
// Helper: extract the best available client IP from a request
// ---------------------------------------------------------------------------

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
