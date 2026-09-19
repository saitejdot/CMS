# SECURITY.md — Living Security Document

## Status Legend
- ✅ PASS — Implemented and verified
- ⚠️ WARNING — Partial or known limitation
- 🔲 TODO — Planned, not yet implemented
- N/A — Not applicable

---

## Authentication

| Check | Status | Notes |
|---|---|---|
| JWT with HS256 | ✅ | `jose` library, `src/lib/auth.ts` |
| HTTP-only cookie | ✅ | `admin_token`, inaccessible to JS |
| Secure cookie (prod) | ✅ | Only sent over HTTPS in production |
| SameSite=Lax | ✅ | Blocks cross-site cookie sending |
| Constant-time password compare | ✅ | `crypto.timingSafeEqual` |
| JWT_SECRET not logged | ✅ | Never printed anywhere |
| Admin password not stored in DB | ✅ | Env var only |
| Session expiry (24h) | ✅ | JWT `exp` claim |
| Token revocation | ⚠️ | JWTs cannot be individually revoked; rotate JWT_SECRET to invalidate all |

## Authorization

| Check | Status | Notes |
|---|---|---|
| Middleware protects `/admin/*` | ✅ | `src/middleware.ts` |
| Middleware protects `/api/admin/*` | ✅ | `src/middleware.ts` |
| `requireAdmin()` in create route | ✅ | Defence-in-depth |
| `requireAdmin()` in update route | ✅ | Defence-in-depth |
| `requireAdmin()` in delete route | ✅ | Defence-in-depth |
| `requireAdmin()` in subscribers route | ✅ | Defence-in-depth |
| Public routes remain public | ✅ | `/api/blog`, `/api/banners`, etc. |
| No client-provided role trust | ✅ | Role derived from verified JWT only |

## CSRF

| Check | Status | Notes |
|---|---|---|
| Origin validation | ✅ | `src/lib/csrf.ts` on all admin mutations |
| SameSite=Lax cookie | ✅ | Browser-level CSRF mitigation |
| No state-changing GETs | ✅ | All mutations are POST |

## Input Validation

| Check | Status | Notes |
|---|---|---|
| Zod on login | ✅ | Password bounded to 128 chars |
| Zod on blog create | ✅ | All fields validated with bounds |
| Zod on blog update | ✅ | ID length enforced (24 chars) |
| Zod on blog delete | ✅ | ID length enforced (24 chars) |
| Zod on subscribe | ✅ | Email format + 254 char max |
| Zod on like | ✅ | UUID visitorId enforced |
| Zod on view | ✅ | UUID visitorId enforced |

## Payload Limits

| Endpoint | Limit | Status |
|---|---|---|
| Login | 1 KB | ✅ |
| Blog create | 5 MB | ⚠️ Temporarily large due to base64 media. Reduce after Phase 1B migration. |
| Blog update | 5 MB | ⚠️ Same as create |
| Blog delete | 1 KB | ✅ |
| Subscribe | 1 KB | ✅ |
| Like / View | 2 KB | ✅ |

## Rate Limiting

| Endpoint | Limit | Status |
|---|---|---|
| Login | 5 / 15min / IP | ✅ Upstash Redis |
| Subscribe | 3 / 1hr / IP | ✅ Upstash Redis |
| Like / View | 30 / 1min / IP | ✅ Upstash Redis |

## Content Security

| Check | Status | Notes |
|---|---|---|
| `dangerouslySetInnerHTML` in blog reader | ⚠️ | Content is admin-authored so trusted, but no sanitization. Add DOMPurify in Phase 2 editor migration. |
| XSS via editor output | ⚠️ | Legacy `document.execCommand` editor; replacement planned Phase 2 |
| Base64 images in DB | ⚠️ | Security risk mitigated; performance/size risk remains until Phase 1B migration |

## Security Headers

| Header | Status | Value |
|---|---|---|
| `Content-Security-Policy` | ✅ | See `next.config.ts` |
| `Strict-Transport-Security` | ✅ | max-age=63072000 |
| `X-Content-Type-Options` | ✅ | nosniff |
| `X-Frame-Options` | ✅ | DENY |
| `Referrer-Policy` | ✅ | strict-origin-when-cross-origin |
| `Permissions-Policy` | ✅ | camera, microphone, geolocation denied |
| CSP `unsafe-inline` for scripts | ⚠️ | Required by Next.js hydration. Nonce-based CSP deferred. |

## Secrets Management

| Check | Status |
|---|---|
| `.env` in `.gitignore` | ✅ |
| `.env.example` has no real values | ✅ |
| No secrets in source code | ✅ |
| No secrets in logs | ✅ |

## Known Issues

See `AI_CONTEXT/KNOWN_ISSUES.md`.
