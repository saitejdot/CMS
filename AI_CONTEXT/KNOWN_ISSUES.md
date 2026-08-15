# KNOWN_ISSUES.md

## Security & Architecture

1. **Large Payloads due to Base64 Media**
   - **Risk**: Moderate. Increases DB size, hurts performance, makes API susceptible to larger payload attacks.
   - **Mitigation**: Temporarily allowed 5 MB payload limits on `create` and `update` APIs.
   - **Resolution**: Planned for Phase 1B (Cloudflare migration).

2. **Synchronous Email Dispatch**
   - **Risk**: Low/Moderate. When publishing a blog, the API loops over all subscribers to send emails synchronously before responding. If the subscriber list grows large, the request will time out (Vercel has strict timeouts).
   - **Mitigation**: Wrapped in a try/catch so email failure doesn't fail the blog creation.
   - **Resolution**: Planned for Phase 1B. Move email sending to an asynchronous background job/queue.

3. **`dangerouslySetInnerHTML`**
   - **Risk**: Low (Admin-trusted input). High (If admin is compromised).
   - **Mitigation**: The system relies on the admin being trusted. No sanitization is currently applied to the HTML string.
   - **Resolution**: Planned for Phase 2. Moving to a structured block editor will mitigate this. If HTML is retained, DOMPurify must be added.

4. **No JWT Revocation**
   - **Risk**: Low (Single admin). If a session is hijacked, it cannot be individually revoked before its 24h expiry.
   - **Mitigation**: Keep token lifetime short (24h). Rotating `JWT_SECRET` revokes all sessions.
   - **Resolution**: Only fix if multi-user or high-security requirements are added. A Redis blocklist could be implemented.

5. **Legacy Editor Flaws**
   - **Risk**: Usability. `document.execCommand` is deprecated and behaves inconsistently across browsers.
   - **Resolution**: Planned for Phase 2 (Block editor).

6. **CSP `unsafe-inline`**
   - **Risk**: Reduces the effectiveness of the Content Security Policy against XSS.
   - **Mitigation**: Required for Next.js client-side hydration and Tailwind styles.
   - **Resolution**: Implementing a nonce-based CSP requires middleware updates that were deferred from Phase 1A to avoid complexity.
