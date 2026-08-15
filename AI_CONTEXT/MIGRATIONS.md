# MIGRATIONS.md

## Migration Log

*No migrations have been executed yet.*

---

## Planned Migrations

### `001-extract-base64-media`
- **Status**: PLANNED (Phase 1B)
- **Purpose**: Extract Base64 images from Blog `content`, upload to Cloudflare Images, and rewrite `content` HTML with Cloudflare URLs.
- **Affected Collections**: `blogs`
- **Requirements**:
  - Must be a standalone Node script (`scripts/migrateMedia.ts`).
  - Must support a `--dry-run` flag.
  - Must produce a detailed report (stories scanned, images found, successes, failures).
  - Must be idempotent and resumable.

### `002-rename-blogs-to-stories`
- **Status**: PLANNED (Phase 1B/2)
- **Purpose**: Align the database collection name with the new product concept ("Stories").

### `003-convert-html-to-blocks`
- **Status**: PLANNED (Phase 2)
- **Purpose**: Migrate legacy HTML content strings to structured JSON blocks for the new editor.
