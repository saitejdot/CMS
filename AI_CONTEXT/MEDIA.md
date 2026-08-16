# MEDIA.md

## Current State (Phase 1A)

- **Images**: Stored as **Base64 strings** embedded directly within the HTML `content` string of Blog posts.
- **Banners**: Served statically from `/public/banners/` via the `fs` module in the `/api/banners` route.
- **Risk**: Base64 embedding inflates the database size drastically and slows down payload delivery.

## Planned Architecture (Phase 1B)

- **Images**: Cloudflare Images. 
- **Videos**: Cloudflare Stream.
- **R2**: Not required for this application scope.

### Upload Flows

**Image Upload (Cloudflare Images)**
1. Browser requests upload via `POST /api/admin/media/auth`.
2. Server validates JWT, image metadata (MIME, size max 10MB), and returns a short-lived (5-minute) Direct Upload URL. *Note: 5-minute expiry is our application security policy, not a Cloudflare requirement.*
3. Browser uploads directly to Cloudflare Images.
4. Server creates a `Media` database record.

**Video Upload (Cloudflare Stream)**
1. Browser requests upload via `POST /api/admin/media/auth`.
2. Server validates JWT, video metadata (MIME, size, duration), and returns a Cloudflare Stream Direct Upload URL. (TUS resumable uploads are planned for the future for large videos).
3. Browser uploads directly to Cloudflare Stream.
4. Server creates a `Media` database record.

### Deletion Architecture
- Deleting a Story does **not** automatically delete Cloudflare media. Media remains in the system for potential reuse.
- Orphan media detection and permanent deletion is deferred to a future cleanup feature.
