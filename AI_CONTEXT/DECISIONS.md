# DECISIONS.md

## Architectural Decision Records (ADR)

### 1. Authentication Strategy
- **Date**: 2026-08-15
- **Decision**: Use stateless JWT (via `jose`) in an HTTP-only cookie for the single-admin system.
- **Reason**: Simple, effective, and avoids session database lookups.
- **Alternatives Considered**: NextAuth (too heavy for single admin), basic auth (poor UX), process-memory sessions (fails in serverless).

### 2. Rate Limiting Provider
- **Date**: 2026-08-15
- **Decision**: Use Upstash Redis (`@upstash/ratelimit`).
- **Reason**: Vercel serverless functions are stateless. In-memory rate limiting fails across edge nodes and cold starts. Upstash provides a fast, persistent, serverless-friendly Redis solution.

### 3. CSRF Strategy
- **Date**: 2026-08-15
- **Decision**: Rely on `SameSite=Lax` cookies combined with server-side `Origin` header validation.
- **Reason**: Adequate for a single-admin system where all state changes are POSTs. Avoids the complexity of managing stateful CSRF synchronizer tokens.

### 4. Admin API Route Namespace
- **Date**: 2026-08-15
- **Decision**: Move all privileged API routes to `/api/admin/*`. Use a global cookie `Path=/`.
- **Reason**: Aligns perfectly with the Next.js middleware matcher (`/api/admin/:path*`), ensuring a clean separation between public and private API surfaces.

### 5. Media Storage (Planned)
- **Date**: 2026-08-15
- **Decision**: Move from Base64 embedded strings to Cloudflare Images/Stream.
- **Reason**: Base64 inflates DB size and payload size drastically. Cloudflare provides optimized delivery.

### 6. Email Provider
- **Date**: 2026-08-16
- **Decision**: CMS v2 currently uses Gmail SMTP through Nodemailer for email delivery. The application uses an email-provider abstraction so the provider can later be replaced by Resend or another transactional email service without changing Story publication logic.
- **Reason**: Resend is intentionally postponed because the current website does not yet require a dedicated transactional email provider or custom sending domain. Gmail + Nodemailer is sufficient for the current scale.
