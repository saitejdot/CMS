# DATABASE.md

## Overview
MongoDB Atlas is used via Mongoose.

## Models (Current & Phase 1B Additions)

### Blog (src/models/Blog.ts)
- **Collection**: `blogs`
- **Purpose**: Stores blog posts.
- **Fields**:
  - `title` (String, required)
  - `slug` (String, required, unique)
  - `content` (String, required)
  - `category` (String, required): Enum `["tech", "fitness", "life", "motivation"]`
  - `tags` ([String])
  - `coverImage` (String, optional)
  - `likes` (Number, default 0)
  - `likedBy` ([String], default [])
  - `views` (Number, default 0)
  - `viewedBy` ([String], default [])
  - `migratedContent` (String, optional) - *Phase 1B Base64 Migration Temp Field*
  - `migrationStatus` (String, enum: `pending`, `migrated`, `verified`, `committed`, `failed`) - *Phase 1B Migration Tracker*
- **Timestamps**: True (`createdAt`, `updatedAt`)

### Subscriber (src/models/Subscriber.ts)
- **Collection**: `subscribers`
- **Purpose**: Stores newsletter subscribers.
- **Fields**:
  - `email` (String, required, unique)
- **Timestamps**: True (`createdAt`, `updatedAt`)

### Media (src/models/Media.ts) - *Phase 1B*
- **Collection**: `media`
- **Purpose**: Tracks uploaded assets outside MongoDB globally (Cloudflare), supporting deduplication and orphan detection.
- **Fields**:
  - `provider` (String, required): e.g. "cloudflare-images", "cloudflare-stream"
  - `providerId` (String, required): Cloudflare Asset ID
  - `type` (String, required): "image" | "video"
  - `url` (String, required): Public delivery URL
  - `filename` (String): Original filename if available
  - `mimeType` (String): e.g., "image/jpeg"
  - `sizeBytes` (Number)
  - `checksum` (String): SHA-256 hash for deduplication during migration and future uploads.
  - `status` (String, default: "ready")
  - `width`, `height` (Number): For images
  - `duration` (Number), `thumbnailUrl` (String): For videos
- **Timestamps**: True (`createdAt`, `updatedAt`)

### EmailLog (src/models/EmailLog.ts) - *Phase 1B*
- **Collection**: `emaillogs`
- **Purpose**: Dedicated tracking of email dispatch results.
- **Fields**:
  - `storyId` (ObjectId, ref: 'Blog')
  - `batchId` (String): Provider's internal batch ID if applicable
  - `idempotencyKey` (String, required, unique): Stable key (e.g. `story-publication-notification:{storyId}:{publicationVersion}:batch:{batchNumber}`)
  - `recipientCount` (Number)
  - `status` (String, enum: `PENDING`, `SENT`, `FAILED`)
  - `providerResponse` (Mixed)
  - `error` (String)
  - `requestId` (String): Tracing ID
- **Timestamps**: True (`createdAt`, `updatedAt`)

## Planned Schema Migrations (Phase 2+)
- Rename `Blog` concept to `Story`.
- Implement structured content array (replacing raw HTML string).
- Add `AuditLog` model (for administrative actions, separate from `EmailLog`).
- Add `Project` and `Career` models.
