# MIGRATIONS.md

## Migration Log

*No migrations have been executed yet.*

---

## Planned Migrations

### `001-extract-base64-media`
- **Status**: IN PROGRESS (Phase 1B)
- **Purpose**: Extract Base64 images from Blog `content`, upload to Cloudflare Images, and create Media records.
- **Affected Collections**: `blogs`, `media`
- **Core Requirements**:
  - Uses `cheerio` for authoritative HTML parsing.
  - Generates SHA-256 checksums of Base64 buffers to deduplicate against the `Media` collection.
  - Non-destructive: Writes output to `migratedContent` leaving `content` untouched. Updates `migrationStatus` (pending, migrated, verified, failed).
- **Commit Phase**:
  - Requires atomic per-Story commit logic, e.g., `$set: { content: "$migratedContent", migrationStatus: "committed" }`, `$unset: { migratedContent: "" }`. No global `$rename`.
- **Reporting**:
  - Outputs a detailed JSON report including per-story failure reasons (`assetsFailed`, `reason`) to allow debugging without exposing sensitive content.
- **Rollback Strategy**:
  - Simple drop of `migratedContent` field for uncommitted records. No automated Cloudflare deletion to avoid breaking deduplicated references.
