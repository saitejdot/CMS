# EDITOR.md

## Current Editor (Phase 1A)
- **Component**: `RichTextEditor` in `AdminClient.tsx`.
- **Implementation**: Uses legacy `document.execCommand` on a `contenteditable` div.
- **Media**: Converts local file uploads to Base64 data URLs via `FileReader` and inserts them as `<img>` tags directly into the HTML.
- **Output**: Generates a single raw HTML string.

## Planned Editor (Phase 2)
- **Implementation**: Move to a modern structured block editor (e.g., Editor.js, Tiptap, or Slate).
- **Data Format**: JSON-based block structure instead of raw HTML. This allows safer rendering, easier migrations, and clean separation of content from presentation.
- **Media**: Uploads to Cloudflare and inserts URLs, entirely removing Base64 from the database.
- **Sanitization**: Introduce strict sanitization (DOMPurify) if HTML rendering is still required.
