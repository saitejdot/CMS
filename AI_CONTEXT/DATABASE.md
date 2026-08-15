# DATABASE.md

## Overview
MongoDB Atlas is used via Mongoose.

## Models (Current - Phase 1A)

### Blog (src/models/Blog.ts)
- **Collection**: `blogs` (implicit from Mongoose model name)
- **Purpose**: Stores blog posts.
- **Fields**:
  - `title` (String, required)
  - `slug` (String, required, unique)
  - `content` (String, required): Contains HTML, including legacy base64 images.
  - `category` (String, required): Enum `["tech", "fitness", "life", "motivation"]`
  - `tags` ([String])
  - `coverImage` (String, optional)
  - `likes` (Number, default 0)
  - `likedBy` ([String], default []): Array of visitor UUIDs
  - `views` (Number, default 0)
  - `viewedBy` ([String], default []): Array of visitor UUIDs
- **Timestamps**: True (`createdAt`, `updatedAt`)

### Subscriber (src/models/Subscriber.ts)
- **Collection**: `subscribers` (implicit)
- **Purpose**: Stores newsletter subscribers.
- **Fields**:
  - `email` (String, required, unique)
- **Timestamps**: True (`createdAt`, `updatedAt`)

## Planned Schema Migrations (Phase 1B)
- Rename `Blog` concept to `Story` (potentially keeping underlying collection name to avoid DB downtime).
- Implement structured content array (replacing raw HTML string).
- Move Base64 images out of the `content` field to Cloudflare, replacing them with URLs.
- Add `AuditLog` model.
- Add `Project` and `Career` models.
- Enforce optimistic concurrency using Mongoose `__v` properly.
