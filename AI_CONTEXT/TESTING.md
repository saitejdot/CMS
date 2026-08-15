# TESTING.md

## Current Testing Strategy (Phase 1A)

Testing is currently focused on static analysis and manual verification of security boundaries.

### Static Analysis
1. **TypeScript Compilation**: `npm run build` (Ensures type safety across the project)
2. **Linting**: `npm run lint` (ESLint Next.js rules)

### Manual Verification Checklist (Phase 1A)
- [x] Admin login sets `admin_token` JWT cookie (HttpOnly, Secure, SameSite=Lax, Path=/).
- [x] Invalid password returns 401.
- [x] Rate limiting works (Login 5/15m, Subscribe 3/1h, Like/View 30/1m).
- [x] Middleware protects `/admin/*` and `/api/admin/*`.
- [x] `requireAdmin()` protects privileged API handlers.
- [x] Unauthenticated POST to `/api/admin/*` returns 401.
- [x] Cross-origin POSTs to privileged routes return 403 (CSRF validation).
- [x] Zod validation correctly rejects malformed bodies (returns 400).
- [x] Payload limits correctly reject oversized requests (returns 413).
- [x] Public site pages and public APIs function correctly.

## Future Testing (Phase 1B+)
- Implement unit tests for utilities (`auth.ts`, `csrf.ts`, `rateLimit.ts`).
- Implement integration tests for protected API routes.
- Set up a test database environment (or mock DB) for CI.
