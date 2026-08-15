# MEDIA.md

## Current State (Phase 1A)

- **Images**: Currently stored as **Base64 strings** embedded directly within the HTML `content` string of Blog posts.
- **Banners**: Served statically from `/public/banners/` via the `fs` module in the `/api/banners` route.
- **Risk**: Base64 embedding inflates the database size drastically and slows down payload delivery. The `POST /api/admin/blog/create` route currently has a temporarily high 5 MB payload limit to accommodate this.

## Planned Architecture (Phase 1B)

- **Storage**: Cloudflare Images (for images) and Cloudflare Stream (for videos).
- **Upload Flow**:
  1. Admin editor requests an upload URL.
  2. Server returns a signed direct-upload URL.
  3. Client uploads directly to Cloudflare.
  4. Client receives media URL and inserts it into the editor.
- **Migration**: A controlled script (`scripts/migrateMedia.ts`) will be written to extract existing Base64 strings from MongoDB, upload them to Cloudflare, and rewrite the HTML content to use the new URLs. **This will NOT be done via a public API route.**

*Credentials for Cloudflare (ACCOUNT_ID, API_TOKEN) are not required until Phase 1B.*
