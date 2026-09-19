# AUTHENTICATION.md

## Overview

CMS v2 uses **stateless JWT authentication** via HTTP-only cookies for the single-admin system.

## Authentication Flow

```
POST /api/auth/login
  │
  ├─ Rate limit (5 / 15min / IP) — Upstash Redis
  ├─ Zod validate { password: string.max(128) }
  ├─ timingSafeEqual(supplied, ADMIN_PASSWORD) — constant-time compare
  │
  ├─ On success: signAdminJWT()
  │     Claims: { sub: "admin", role: "admin", jti: uuid, iat, exp: +24h }
  │     Algorithm: HS256
  │     Secret: JWT_SECRET (env var, never logged)
  │
  └─ Set cookie: admin_token
        HttpOnly: true          ← inaccessible to JS
        Secure: true (prod)     ← HTTPS only in production
        SameSite: Lax           ← CSRF mitigation
        Path: /                 ← sent on all paths
        MaxAge: 86400           ← 24 hours
```

## Cookie

| Property | Value | Reason |
|---|---|---|
| Name | `admin_token` | Descriptive, no legacy collision |
| HttpOnly | true | Cannot be read by `document.cookie` |
| Secure | true (prod only) | HTTPS enforcement in production |
| SameSite | Lax | Blocks cross-site POST cookie sending |
| Path | `/` | Must cover both `/admin/*` and `/api/admin/*` |
| MaxAge | 86400 (24h) | Reasonable session duration |

## Authorization Architecture

```
Request
  ↓
src/middleware.ts         — front-line JWT verification
  ↓
Route Handler
  ↓
requireAdmin()            — defence-in-depth, returns AdminPrincipal
  ↓
checkCSRF()               — Origin header validation
  ↓
Zod validation            — runtime input validation
  ↓
Business Logic
```

**Neither middleware nor requireAdmin() alone is sufficient — both must be present.**

## requireAdmin()

Location: `src/lib/auth.ts`

Returns: `AdminPrincipal | NextResponse`

Usage pattern in every privileged handler:
```typescript
const principal = await requireAdmin();
if (principal instanceof NextResponse) return principal;
// principal.sub, principal.role, principal.jti are now available
```

## AdminPrincipal Shape

```typescript
interface AdminPrincipal {
  sub: string;    // "admin"
  role: "admin";  // always "admin"
  jti: string;    // unique token ID (UUID)
  exp: number;    // expiry (Unix timestamp)
}
```

## CSRF Strategy

See `src/lib/csrf.ts`.

- **SameSite=Lax** prevents cross-site POSTs from sending the cookie (browser enforcement)
- **Origin header validation** provides server-side confirmation
- No stateful CSRF tokens needed for this architecture
- State-changing GET requests: structurally prohibited — all mutations use POST

Allowed origins: `NEXT_PUBLIC_BASE_URL` + `http://localhost:3000`

## Logout

`POST /api/auth/logout` — sets `admin_token` with `maxAge: 0` to expire immediately.

## Password Handling

- Stored: nowhere — only in `ADMIN_PASSWORD` environment variable
- Comparison: `crypto.timingSafeEqual()` — constant-time to prevent timing attacks
- Never logged, never sent to client

## Secrets

| Secret | Purpose | Never do |
|---|---|---|
| `JWT_SECRET` | Sign/verify JWTs | log it, commit it, hardcode it |
| `ADMIN_PASSWORD` | Admin login | log it, store in DB, send to client |

## Session Invalidation

Current limitation: JWTs cannot be individually revoked before expiry.  
If the JWT_SECRET is rotated, all existing sessions are immediately invalidated.  
This is acceptable for a single-admin personal site.

Future improvement: Redis-backed token blocklist if required.
