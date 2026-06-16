# Feature Catalog & Specification: CMS

This document provides a descriptive catalog of the features implemented in the CMS. It details user-facing capabilities, editor specifications, data synchronization mechanisms, and operational components.

---

## 1. Core Feature Matrix

| Feature | Scope | Target User | Technology / Components |
| :--- | :--- | :--- | :--- |
| **Dynamic Portfolio CMS** | Admin | Administrator | `AdminClient`, Mongoose `Blog` |
| **Rich Text Editor (RTE)** | Admin | Administrator | `RichTextEditor`, `document.execCommand` |
| **Direct Media Uploads** | Admin | Administrator | Cloudinary Multipart SDK, `sign` endpoint |
| **Optimistic Like Toggles**| Public | Visitors | `LikeButton`, LocalStorage, `/api/blog/like` |
| **Unique View Logging** | Public | Visitors | `ViewTracker`, LocalStorage, `/api/blog/view` |
| **Newsletter Hub** | Public | Visitors | `SubscribeForm`, Nodemailer, Subscriber DB |
| **One-Click Unsubscribe** | System | Subscribers | `/api/unsubscribe`, HTML render |
| **Dual Theme System** | Public | All Users | `ThemeToggle`, LocalStorage, CSS Class injection |

---

## 2. Dynamic Content Management System (CMS)

The administration panel (`/admin`) allows the site owner to manage content without writing code or accessing database interfaces:
- **Automatic Slug Generation**: When creating or editing a blog post, the system converts the `title` into a web-safe URL slug by:
  - Converting all characters to lowercase.
  - Replacing non-alphanumeric characters with hyphens.
  - Trimming leading or trailing hyphens.
- **Categorization**: Enforces strict organization via a schema enum. Posts must belong to `tech`, `fitness`, `life`, or `motivation`.
- **Excerpts Engine**: Post lists automatically strip HTML tags from content strings via regex in `stripHtml()` to generate 100-character descriptive previews.

---

## 3. Custom Rich Text Editor (RTE) Specification

The application features a custom, lightweight WYSIWYG editor built without bloated external text-editor libraries (like DraftJS or Quill).

### A. Core Formatting Capabilities
- **Native Document Exec**: Utilizes `document.execCommand` under the hood. Focuses the editor wrapper, runs native commands, and syncs contents back to React state.
- **Text Styling**: Bold, Italic, Underline, Strikethrough, FontSize (1 to 7), and Font Families.
- **Color Selection**: Pop-up swatches allow setting text color (`foreColor`) and background highlights (`hiliteColor`).
- **Structure**: Native paragraph tags, headings (H1, H2, H3), blockquotes, horizontal rules, bullet lists, ordered lists, and hyperlink injections.

### B. Media Injection Pipeline
The editor supports uploading images, videos, and raw audio directly into the content stream:
1. **Cloud Upload**: Fetches a signature via `/api/media/sign` and posts files directly to Cloudinary.
2. **HTML Wrappers**: Injects standard HTML markup into the editor at the cursor position:
   - **Images**: `<div class="blog-media-wrapper"><img src="..." .../> ...</div>`
   - **Videos**: `<div class="blog-media-wrapper"><video src="..." ...></video> ...</div>`
   - **Audio**: `<div class="blog-media-wrapper"><audio src="..."></audio> ...</div>`
3. **Editor Removal Buttons**: Injects a helper remove button inside the markup:
   `<button class="admin-remove-media-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>`
   - **UX Trick**: The button allows the admin to delete media blocks inline.
   - **Public Separation CSS**: Globally targets `button.admin-remove-media-btn` and sets `display: none !important;` in public view, showing the button only inside the admin rich text editor (`.rte-editor`).

---

## 4. User Engagement Features

### A. Optimistic Likes Toggler (`LikeButton`)
- **First Load Sync**: Reads local storage to check if this post slug is in the `cms_liked_posts` array. If true, the heart renders as filled.
- **Optimistic UI**: When clicked, the heart fill state toggles and the count updates immediately.
- **API and Local Storage Update**: The client sends a background request to `/api/blog/like` and adds or removes the slug in local storage based on the response.
- **Animations**: Triggers a CSS scaling pulse animation (`like-pop` keyframe) upon liking to provide visual feedback.

### B. Unique View Tracker (`ViewTracker`)
- **Device Identification**: On initial page load, the system checks local storage for `cms_visitor_id`. If missing, it generates a unique UUID using `crypto.randomUUID()` and saves it.
- **Registration**: When visiting a post page, the client calls `/api/blog/view` with the slug and visitor ID. The backend verifies uniqueness in the `View` collection before incrementing the post's total view count in MongoDB.

---

## 5. Automated Subscriber Newsletter Hub

### A. Sign-Up Loop
Visitors can submit their email address via the `SubscribeForm`. The input uses standard email regex validation and is rate-limited to prevent abuse.

### B. Post Publication Alerts
Upon publishing a new article, the server iterates through all email subscribers. For each subscriber, it sends an email containing:
- A clean, modern HTML layout showing the post title, category, and an excerpt.
- A button linking to the article.
- A footer containing an unsubscribe link.

### C. One-Click Unsubscribe
Subscribers can opt out by clicking the unsubscribe link in the email. This sends a GET request containing their email address to the `/api/unsubscribe` endpoint, which removes them from the database and renders a confirmation page.
