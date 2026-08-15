# CURRENT CMS SPECIFICATION

This document provides a complete current-state specification / reverse-engineered blueprint of the Naga Sai Teja Personal Blog CMS. It documents exactly what is currently implemented in the repository, serving as a baseline for future redesigns.

---

## Table of Contents
1. [PART A — PROJECT IDENTITY](#part-a--project-identity)
2. [PART B — COMPLETE ROUTE / PAGE MAP](#part-b--complete-route--page-map)
3. [PART C — UI / VISUAL DESIGN SYSTEM](#part-c--ui--visual-design-system)
4. [PART D — NAVIGATION](#part-d--navigation)
5. [PART E — COMPONENT-BY-COMPONENT UI INVENTORY](#part-e--component-by-component-ui-inventory)
6. [PART F — HOMEPAGE](#part-f--homepage)
7. [PART G — BLOG SYSTEM](#part-g--blog-system)
8. [PART H — STORY CAROUSEL](#part-h--story-carousel)
9. [PART I — ADMIN / CMS](#part-i--admin--cms)
10. [PART J — COMPLETE DATABASE DOCUMENTATION](#part-j--complete-database-documentation)
11. [PART K — DATA STORAGE AND DATA FLOW](#part-k--data-storage-and-data-flow)
12. [PART L — API DOCUMENTATION](#part-l--api-documentation)
13. [PART M — AUTHENTICATION AND SECURITY](#part-m--authentication-and-security)
14. [PART N — EXTERNAL SERVICES](#part-n--external-services)
15. [PART O — ENVIRONMENT VARIABLES](#part-o--environment-variables)
16. [PART P — ERROR HANDLING AND GRACEFUL DEGRADATION](#part-p--error-handling-and-graceful-degradation)
17. [PART Q — PERFORMANCE](#part-q--performance)
18. [PART R — SEO AND METADATA](#part-r--seo-and-metadata)
19. [PART S — DEPLOYMENT](#part-s--deployment)
20. [PART T — FILE / DIRECTORY ARCHITECTURE](#part-t--file--directory-architecture)
21. [PART U — DEPENDENCY / PACKAGE ANALYSIS](#part-u--dependency--package-analysis)
22. [PART V — CURRENT FEATURES](#part-v--current-features)
23. [PART W — CURRENT UX FLOWS](#part-w--current-ux-flows)
24. [PART X — CURRENT DESIGN TOKENS / UI CONSTANTS](#part-x--current-design-tokens--ui-constants)
25. [PART Y — CURRENT PROBLEMS / TECHNICAL DEBT](#part-y--current-problems--technical-debt)
26. [PART Z — CURRENT STATE SUMMARY](#part-z--current-state-summary)

---

## PART A — PROJECT IDENTITY

* **Project Name:** Naga Sai Teja CMS
* **Current Website URL:** https://tejwrites.vercel.app (identifiable via email configuration baseUrl)
* **Project Purpose:** Personal blog, portfolio, and CMS for Naga Sai Teja Bollimuntha.
* **Current Product Identity:** A minimalist, developer-focused personal brand site.
* **Target Audience:** Readers interested in Tech, Fitness, Life, and Motivation.
* **What visitors can do:** Read blogs, view dynamic stories (carousel), like blogs, subscribe to emails, and find contact info.
* **What the site owner can do:** Access an admin dashboard to create, read, update, and delete blogs; view subscriber counts and copy subscriber emails.
* **Current Architecture:** Next.js 16 App Router full-stack app (React 19) connected to MongoDB.
* **Current Technology Stack:** Next.js, React, Tailwind CSS, Mongoose/MongoDB, Nodemailer.

**Public-facing functionality:** Homepage, Story Carousel, Blog listing with filters, Individual blog reading (likes/views), Subscription form, Contact page.
**Admin/internal functionality:** Admin login, blog CRUD via custom Rich Text Editor, subscriber email viewing, email broadcasting upon new blog publish.

---

## PART B — COMPLETE ROUTE / PAGE MAP

```text
/
├── Page Name: Homepage
├── Purpose: Introduction, latest 3 blogs, story carousel, subscriber count, subscribe form.
├── Access: Public
├── Type: Server Component (dynamic)
├── Data: Fetches latest 3 blogs and total subscriber count directly via Mongoose.
└── Components: Navbar, StoryCarousel, SubscribeForm, ContactSection, Footer.

/blogs
├── Page Name: Blog Listing
├── Purpose: Displays all published blogs with search and filtering.
├── Access: Public
├── Type: Client Component
├── Data: Fetches from `/api/blog`.
└── Components: BackButton, ContactSection.

/blog/[slug]
├── Page Name: Individual Blog Page
├── Purpose: Displays a single blog's rich HTML content.
├── Access: Public
├── Type: Server Component
├── Data: Fetches a single blog by slug via Mongoose.
└── Components: BackButton, ViewTracker, LikeButton, SubscribeForm, ContactSection.

/contact
├── Page Name: Contact Page
├── Purpose: Displays social links and a subscription form.
├── Access: Public
├── Type: Server Component
└── Components: BackButton, SubscribeForm.

/admin
├── Page Name: Admin Dashboard
├── Purpose: Manage blogs and subscribers.
├── Access: Private (Requires `admin=true` cookie)
├── Type: Server Component protecting a Client Component (`AdminClient`)
├── Data: Server checks cookie, `AdminClient` fetches `/api/blog` and `/api/subscribers`.
└── Components: AdminClient.

/admin/login
├── Page Name: Admin Login
├── Purpose: Authenticate site owner.
├── Access: Public
├── Type: Client Component
└── API: POST to `/api/auth/login`.
```

* **404 behavior:** Uses Next.js default.
* **Loading states:** `/blogs` implements a custom spinner and skeleton loaders. Homepage implements ghost placeholder cards when no blogs exist.
* **Redirects:** `/admin` redirects to `/admin/login` if the `admin` cookie is missing.

---

## PART C — UI / VISUAL DESIGN SYSTEM

### Overall Visual Identity
* **Aesthetic:** Minimal, modern, highly contrast-driven, utilizing a paper/typewriter theme (Underwood font for logos).
* **Light/Dark Mode:** Yes, fully implemented via `.dark` class toggling.
* **Spacing:** Spacious, relying heavily on padding, centered max-width containers (max-w-4xl, max-w-3xl).
* **Border Radius:** Rounded (mostly 8px or 12px for cards).

### Colors
**Light Theme:**
* Background (`--bg`): `#fcde7b` (Yellowish paper)
* Card (`--card`): `#fae0a0`
* Text (`--text`): `#383c45` (Slate)
* Muted Text (`--muted`): `#000000`
* Border (`--border`): `#ffa600`
* Accent (`--accent`): `#ffa200` (Orange)
* Accent Soft (`--accent-soft`): `#b8f2e6`
* Highlight (`--highlight`): `#ff0000`

**Dark Theme:**
* Background (`--bg`): `#0b090a` (Onyx)
* Card (`--card`): `#0a273c` (Carbon Black)
* Text (`--text`): `#fffef0` (White smoke)
* Muted Text (`--muted`): `#b1a7a6` (Silver)
* Border (`--border`): `#2a2a2a` (Dust grey dark)
* Accent (`--accent`): `#e5383b` (Strawberry red)
* Accent Soft (`--accent-soft`): `#ba181b` (Mahogany red)
* Highlight (`--highlight`): `#a4161a` (Deep red)

**Gradients:**
The `body` background features a top-to-bottom linear gradient creating a subtle fade effect.

### Typography
* **Font Family:** 
  * Logo/Display: `Underwood` (Custom local woff font)
  * Headings (`--font-heading`): `Playfair Display` (Google Fonts)
  * Body (`--font-body`): `Source Sans 3` (Google Fonts)
* **Font Weights:** Headings (500, 600, 700), Body (400, 500).

### Layout
* **Max Width:** `max-w-4xl` (approx 896px) for Home/Nav, `max-w-3xl` for Blog reading.
* **Grid Systems:** Used in Contact page (2x2 grid for social links) and Admin dashboard.
* **Flex Layouts:** Extensively used in Navbar, meta rows, and admin headers.
* **Cards:** `.card` class adds background, border, 12px radius, and a 0.2s hover translation (-2px Y).

### Responsive Behavior
* **Desktop:** Navbar shows inline links. Story carousel shows arrow controls on hover.
* **Mobile:** Navbar hides links and shows a hamburger icon opening a full-height sliding sidebar (translate-x). Story carousel relies heavily on touch/swipe gestures.

---

## PART D — NAVIGATION

### Navbar
* **Logo:** Text-based "Naga Sai Teja" using Underwood font with a blinking cursor animation (`▋`).
* **Position:** Sticky top with z-index 50, border-bottom.
* **Links:** Home, Blogs, Contact, Admin, ThemeToggle.
* **Mobile Menu:** Hamburger (☰) opens a right-side sliding panel with a backdrop-blur. Closes on '✕' click or backdrop click.

### Footer
* **Layout:** Centered text, simple border-top.
* **Content:** Copyright year and name.

### In-page Navigation
* **BackButton:** A reusable component appearing on `/blogs`, `/blog/[slug]`, `/admin`, and `/contact` to navigate back to the previous context.

---

## PART E — COMPONENT-BY-COMPONENT UI INVENTORY

1. **Navbar (`src/components/Navbar.tsx`)**
   * **Purpose:** Main navigation.
   * **State:** `open` (boolean) for mobile menu.
   * **Responsive:** Hidden links on mobile, slide-out sidebar.

2. **Footer (`src/components/Footer.tsx`)**
   * **Purpose:** Simple copyright footer.

3. **StoryCarousel (`src/components/StoryCarousel.tsx`)**
   * **Purpose:** Instagram-like stories.
   * **State:** Extensive reducer managing current story, device type, progress, and transition states.
   * **API Calls:** GET `/api/banners` to discover available media.

4. **AdminClient (`src/components/AdminClient.tsx`)**
   * **Purpose:** Dashboard UI.
   * **State:** `blogs`, `subscribers`, `editingId`, rich text editor states.
   * **API Calls:** GET/POST to `/api/blog`, `/api/blog/create`, `/api/blog/update`, `/api/blog/delete`, `/api/subscribers`, `/api/auth/logout`.
   * **UI:** Custom WYSIWYG editor using `document.execCommand`.

5. **SubscribeForm (`src/components/SubscribeForm.tsx`)**
   * **Purpose:** Email subscription.
   * **State:** `email`, `status` (idle, loading, success, error).
   * **API Calls:** POST to `/api/subscribe`.

6. **ThemeToggle (`src/components/ThemeToggle.tsx`)**
   * **Purpose:** Toggle light/dark mode.
   * **State:** Modifies `document.documentElement.classList`. Saves to localStorage.

7. **ContactSection (`src/components/ContactSection.tsx`)**
   * **Purpose:** Reusable footer-level block with 4 social links (Email, Insta, LinkedIn, GitHub).

8. **LikeButton (`src/components/LikeButton.tsx`)**
   * **Purpose:** Tracks and increments blog likes.
   * **State:** `likes`, `liked`, `animate`. Stores liked status in localStorage.
   * **API Calls:** POST to `/api/blog/like`.

9. **ViewTracker (`src/components/ViewTracker.tsx`)**
   * **Purpose:** Silently records a view and displays count.
   * **State:** `views`. Uses `hasViewed_[slug]` in sessionStorage to prevent duplicate counts per session.
   * **API Calls:** POST to `/api/blog/view`.

10. **BackButton (`src/components/BackButton.tsx`)**
    * **Purpose:** Simple `router.back()` button with an arrow icon.

---

## PART F — HOMEPAGE

**Structure (Top to Bottom):**
1. **Navbar**
2. **Story Carousel:** Fetches from `/api/banners`.
3. **Subscriber Count Pill:** Right-aligned display of total DB subscribers.
4. **Profile Identity:** Overlapping absolute positioned profile image (`/profile.jpeg`). H1 greeting and short bio.
5. **About Section:** Short text ("To define is to limit.").
6. **Latest Blogs:** Fetches top 3 most recent blogs. Renders `.card` components. Shows ghost cards if empty.
7. **View All Link:** Link to `/blogs`.
8. **Subscribe Form:** Card with text and the `SubscribeForm` component.
9. **Contact Section:** 2x2 grid of social links.
10. **Footer**

**Data Source:** Directly queries MongoDB via `Blog.find().sort({ createdAt: -1 }).limit(3)` and `Subscriber.countDocuments()` in the Server Component.

---

## PART G — BLOG SYSTEM

### Blog Listing (`/blogs`)
* **Layout:** Vertical list of `.card` components.
* **Filters:** Search input (by title), Category dropdown (All, Tech, Fitness, Life, Motivation), Sort dropdown (Latest, Oldest).
* **Pagination:** None. Fetches all blogs and filters client-side.
* **Empty State:** Shows a beautiful SVG outline illustration if no blogs exist.
* **Loading State:** Spinning circle.

### Individual Blog Page (`/blog/[slug]`)
* **Layout:** Back button, Title, Meta row (Date + Views), Content, Category text, Tags (pills), Like button, Subscribe block.
* **Content Rendering:** Uses `dangerouslySetInnerHTML` for the rich HTML stored in the database.
* **Metadata displayed:** Date (formatted IST), Views, Likes, Tags.

### Blog Content Format
* **Format:** Raw HTML string generated by the custom `RichTextEditor` in `AdminClient`.
* **Features supported:** H1, H2, H3, paragraphs, bold, italic, underline, colors, lists, blockquotes, alignments, and embedded media (`<img>`, `<video>`, `<audio>`) stored as base64 data URLs inside `<div>` wrappers.

---

## PART H — STORY CAROUSEL

* **Location:** `src/components/StoryCarousel.tsx`
* **Data Source:** Fetches from `/api/banners`, which reads files directly from `/public/banners/desktop` and `/public/banners/mobile`.
* **File Requirements:** Files must be named with integers (e.g., `1.jpg`, `2.mp4`) to determine order.
* **Duration:** Images show for 5000ms. Videos play until they emit `onEnded`.
* **Controls:** 
  * Progress bar at the top (Instagram style).
  * Desktop: Hover-visible previous/next arrows. Keyboard arrows supported.
  * Mobile: Touch/swipe gestures supported.
* **State Management:** Uses a complex `useReducer` to manage transitions, device detection via `matchMedia`, and timers.

---

## PART I — ADMIN / CMS

### Access & Authentication
* **Path:** `/admin`
* **Login:** `/admin/login` takes a password. If it matches `process.env.ADMIN_PASSWORD`, it sets an HTTP-only cookie `admin=true`.

### Dashboard Layout
* Header with Logout button.
* **Create Section:** Inputs for Title, Category (dropdown), Tags (comma separated), and a full Rich Text Editor.
* **All Posts Section:** Lists all blogs. Displays category, likes, views.
* **Actions:** Edit (opens inline editor), Delete (with confirmation alert).
* **Subscribers Section:** Shows a table of emails and subscription dates. Includes a "Copy all emails" utility button.

### Content Creation Flow
1. Admin fills out form and uses the custom RTE. Media uploaded is converted to base64 strings and embedded in the HTML.
2. Clicks Publish -> POST `/api/blog/create`.
3. Server generates a `slug` from the title.
4. Saves to MongoDB.
5. Server loops through all subscribers and uses `nodemailer` to send an HTML email notifying them of the new post, including a direct link and an unsubscribe link.

---

## PART J — COMPLETE DATABASE DOCUMENTATION

Using **Mongoose** (MongoDB).

### Model: `Blog`
* **Collection:** `blogs` (implied by Mongoose).
* **Fields:**
  * `title`: String, required.
  * `slug`: String, required, unique.
  * `content`: String (HTML), required.
  * `category`: String, enum: `["tech", "fitness", "life", "motivation"]`, required.
  * `tags`: Array of Strings.
  * `coverImage`: String (optional).
  * `likes`: Number, default `0`.
  * `likedBy`: Array of Strings, default `[]` (Stores client IDs).
  * `views`: Number, default `0`.
  * `viewedBy`: Array of Strings, default `[]`.
* **Timestamps:** `true` (adds `createdAt`, `updatedAt`).

### Model: `Subscriber`
* **Collection:** `subscribers`.
* **Fields:**
  * `email`: String, required, unique.
* **Timestamps:** `true`.

---

## PART K — DATA STORAGE AND DATA FLOW

* **MongoDB:** Primary persistent storage (Blogs, Subscribers).
* **Cookies:** `admin=true` (HTTP-only) used for admin session authorization.
* **LocalStorage:**
  * `theme`: Stores "dark" or "light".
  * `liked_[slug]`: Boolean flag to prevent users from liking a post multiple times across sessions.
  * `clientId`: A random UUID generated by `LikeButton` to identify unique likers in the DB.
* **SessionStorage:**
  * `hasViewed_[slug]`: Boolean flag to ensure views are only incremented once per browser session.
* **File System:** `/public/banners/` acts as a local database for story carousel media.

---

## PART L — API DOCUMENTATION

| Method | Endpoint | Auth | Purpose |
| ------ | -------- | ---- | ------- |
| POST | `/api/auth/login` | Public | Validates password, sets `admin` cookie. |
| POST | `/api/auth/logout` | Public | Clears `admin` cookie. |
| GET | `/api/banners` | Public | Reads `/public/banners` dir, returns media list. |
| GET | `/api/blog` | Public | Returns all blogs sorted by latest. |
| POST | `/api/blog/create` | None (Vulnerable)* | Creates blog, broadcasts emails via Nodemailer. |
| POST | `/api/blog/delete` | None (Vulnerable)* | Deletes a blog by ID. |
| POST | `/api/blog/update` | None (Vulnerable)* | Updates an existing blog. |
| POST | `/api/blog/like` | Public | Increments likes and adds clientId to `likedBy`. |
| POST | `/api/blog/view` | Public | Increments views and adds clientId to `viewedBy`. |
| POST | `/api/subscribe` | Public | Adds email to Subscriber collection. |
| GET | `/api/subscribers` | None (Vulnerable)* | Returns list of all subscriber emails. |
| GET | `/api/unsubscribe` | Public | Removes email from Subscriber collection. |

*\*Note: The UI requires admin login to reach the dashboard, but the underlying API endpoints (`create`, `delete`, `update`, `subscribers`) do not verify the `admin` cookie on the server side.*

---

## PART M — AUTHENTICATION AND SECURITY

* **Admin Auth:** Very basic. Uses a single hardcoded password (`ADMIN_PASSWORD`). If correct, sets an HTTP-only cookie.
* **Route Protection:** `/admin/page.tsx` checks the cookie before rendering `AdminClient`.
* **Security Weaknesses (High Priority):**
  1. **Unprotected API Routes:** The CRUD API routes (`/api/blog/create`, `update`, `delete`) and `/api/subscribers` do NOT verify the cookie. Anyone with knowledge of the endpoint can send POST requests to modify the database or scrape subscriber emails.
  2. **Base64 Image Storage:** The Rich Text Editor converts uploaded images/video to base64 strings and saves them directly in the MongoDB `content` field. This will quickly bloat the database and cause 16MB document size limit issues.
  3. **No Rate Limiting:** Subscription and Like/View endpoints have no rate limiting.
  4. **Basic Password:** Admin auth relies on a single string comparison, vulnerable to timing attacks, though low risk for a personal blog.

---

## PART N — EXTERNAL SERVICES

* **MongoDB Atlas:** Database hosting. (Connection string in `MONGODB_URI`).
* **SMTP Provider (Gmail):** Used by `nodemailer` for broadcasting emails. (Credentials in `EMAIL_USER`, `EMAIL_PASS`).
* **Vercel:** Deployment platform (Inferred from Next.js usage and `https://tejwrites.vercel.app` hardcoding).

---

## PART O — ENVIRONMENT VARIABLES

| Variable | Purpose | Required | Used By |
| -------- | ------- | -------- | ------- |
| `MONGODB_URI` | MongoDB connection string | Yes | `src/lib/db.ts` |
| `EMAIL_USER` | SMTP Email Address | Yes | `src/lib/mail.ts` |
| `EMAIL_PASS` | SMTP App Password | Yes | `src/lib/mail.ts` |
| `ADMIN_PASSWORD` | Password to access `/admin` | Yes | `/api/auth/login/route.ts` |
| `NEXT_PUBLIC_BASE_URL` | Base URL for email links | No (fallbacks exist) | `/api/blog/create/route.ts` |

---

## PART P — ERROR HANDLING AND GRACEFUL DEGRADATION

* **Database Failure:** `src/app/page.tsx` catches DB errors and returns an empty array to prevent the homepage from crashing (Ghost cards are shown).
* **Missing Blogs:** Handled gracefully on `/blogs` with an empty state SVG.
* **404 Blog:** `/blog/[slug]` returns a basic `<h1>Blog not found</h1>` if slug doesn't exist.
* **No Banners:** `StoryCarousel` displays a fallback message if no banners are found in the filesystem.

---

## PART Q — PERFORMANCE

* **Server Components:** Utilized heavily (`/`, `/blog/[slug]`) to fetch DB directly during render, reducing client JS payload.
* **Dynamic Rendering:** Many pages use `export const dynamic = 'force-dynamic'` preventing static caching, meaning every request hits the DB.
* **Fonts:** Optimized using `next/font/google`.
* **CSS:** Tailwind v4 handles unused CSS purging automatically.
* **Image Optimization:** Not utilized properly. Profile image uses standard `<img>`. Blog content uses base64 `<img>` tags which hurt performance significantly.

---

## PART R — SEO AND METADATA

* **Global Metadata:** Defined in `src/app/layout.tsx` ("Naga Sai Teja Bollimuntha - Blogger...").
* **Page Metadata:** Defined in `src/app/contact/page.tsx`.
* **Missing SEO Features:** 
  * Individual blogs (`/blog/[slug]`) do NOT generate dynamic metadata (missing `generateMetadata`).
  * No Open Graph/Twitter card tags.
  * No Sitemap or `robots.txt` present.

---

## PART S — DEPLOYMENT

* **Platform:** Vercel (assumed by `vercel.svg` and standard Next.js conventions).
* **Build Command:** `next build`
* **Development Command:** `next dev`
* **Node Version:** Requires >= Node 20 (based on `@types/node` in package.json).

---

## PART T — FILE / DIRECTORY ARCHITECTURE

```text
CMS/
├── public/                 # Static assets
│   ├── banners/            # Local DB for StoryCarousel media
│   │   ├── desktop/
│   │   └── mobile/
│   ├── fonts/              # Custom font (Underwood)
│   └── profile.jpeg
├── src/
│   ├── app/                # Next.js App Router pages & APIs
│   │   ├── admin/          # Admin UI
│   │   ├── api/            # Backend API routes
│   │   ├── blog/[slug]/    # Blog detail view
│   │   ├── blogs/          # Blog list view
│   │   └── contact/        # Contact page
│   ├── components/         # Reusable React components
│   │   ├── AdminClient.tsx
│   │   ├── StoryCarousel.tsx
│   │   ├── RichTextEditor (inside AdminClient)
│   │   └── ...
│   ├── lib/                # Backend utilities (db.ts, mail.ts)
│   ├── models/             # Mongoose schemas (Blog.ts, Subscriber.ts)
│   └── utils/              # Frontend utilities (date.ts)
├── .env                    # Secrets
├── tailwind.config.ts      # Tailwind configuration
└── package.json
```

---

## PART U — DEPENDENCY / PACKAGE ANALYSIS

* `next` (16.2.3): React framework.
* `react` & `react-dom` (19.2.4): UI Library.
* `mongoose` (^9.4.1): MongoDB ODM.
* `nodemailer` (^8.0.5): For sending email broadcasts to subscribers.
* `tailwindcss` (^4) & `@tailwindcss/postcss`: Styling engine.
* *Note: No external UI libraries (like Shadcn or Framer Motion) are used. Everything is custom CSS.*

---

## PART V — CURRENT FEATURES

### Public
* **Story Carousel:** Implemented
* **Blog Reading:** Implemented
* **Blog Filtering/Search:** Implemented
* **View Tracking:** Implemented
* **Like System:** Implemented
* **Email Subscription:** Implemented

### Admin
* **Admin Login:** Implemented
* **Blog CRUD:** Implemented
* **Rich Text Editor:** Implemented (Custom built)
* **View Subscribers:** Implemented
* **Email Broadcasting:** Implemented (Fires automatically on blog creation)

---

## PART W — CURRENT UX FLOWS

**Visitor reads a blog & likes:**
Homepage -> Clicks Blog Card -> Redirects to `/blog/[slug]` -> `ViewTracker` automatically POSTs view -> User clicks Heart -> `LikeButton` POSTs like -> Heart animates & turns red -> Saved to LocalStorage.

**Admin creates a blog:**
`/admin/login` -> Enters password -> Redirect to `/admin` -> Fills Title/Category/Tags -> Uses Editor to upload images (converted to base64) & format text -> Clicks Publish -> POST `/api/blog/create` -> MongoDB Saves -> Nodemailer loops over all subscribers sending HTML email -> UI Refreshes.

---

## PART X — CURRENT DESIGN TOKENS / UI CONSTANTS

Defined in `src/app/globals.css`:
* `--bg`: Light (`#fcde7b`), Dark (`#0b090a`)
* `--card`: Light (`#fae0a0`), Dark (`#0a273c`)
* `--text`: Light (`#383c45`), Dark (`#fffef0`)
* `--accent`: Light (`#ffa200`), Dark (`#e5383b`)
* `--border`: Light (`#ffa600`), Dark (`#2a2a2a`)

Custom CSS Classes:
* `.input-pro`: Form inputs with custom focus rings.
* `.card`: Primary surface container.

---

## PART Y — CURRENT PROBLEMS / TECHNICAL DEBT

**Confirmed Problems (High Priority):**
1. **API Security:** Admin API routes (`/api/blog/create`, `/api/blog/delete`, etc.) do not verify the `admin` cookie. They are fully exposed to the public.
2. **Database Bloat:** The custom Rich Text Editor converts image/video uploads directly to Base64 strings and saves them in the `content` field. This will rapidly exceed MongoDB's 16MB document limit and causes massive network payloads.
3. **Synchronous Email Broadcasting:** In `/api/blog/create`, `sendEmail` is called in a `for` loop awaiting each send. If there are 100+ subscribers, the API request will timeout on Vercel.
4. **Hardcoded URLs:** Email templates hardcode `https://tejwrites.vercel.app` if `NEXT_PUBLIC_BASE_URL` is missing.

**Potential Concerns:**
1. **Force Dynamic:** `force-dynamic` is used extensively. High traffic will hammer the database since there is no caching layer.
2. **SEO:** Missing dynamic `<title>` and `<meta>` tags for individual blog pages.

---

## PART Z — CURRENT STATE SUMMARY

**CURRENT CMS**
* **Frontend:** Next.js 16 (React 19), Tailwind CSS, Custom Light/Dark themes. Minimalist UI.
* **Backend:** Next.js API Routes.
* **Database:** MongoDB via Mongoose (Blogs, Subscribers).
* **Authentication:** Single hardcoded password for Admin. (API endpoints remain unprotected).
* **Content:** Stored as raw HTML strings containing Base64 media.
* **Public Pages:** Home, Blog list, Blog detail, Contact.
* **Admin:** Custom dashboard with bespoke WYSIWYG editor.
* **External Services:** MongoDB Atlas, Gmail SMTP (Nodemailer).
* **Deployment:** Vercel.
* **Major Features:** Carousel, Email Subscription broadcasting, View/Like tracking.
* **Known Issues:** API vulnerabilities, Base64 DB bloat, Synchronous email sending limits.

# CURRENT ARCHITECTURE IN ONE DIAGRAM

```text
                            USER / VISITOR
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
              PUBLIC UI                       ADMIN UI
          (Home, Blogs, Story)          (Login, Dashboard, Editor)
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                         NEXT.JS APP ROUTER
                                  │
                  ┌───────────────┴───────────────┐
                  │                               │
           SERVER COMPONENTS                 API ROUTES
          (Direct DB Queries)        (CRUD, Email, Likes, Views)
                  │                               │
                  └───────────────┬───────────────┘
                                  │
                               MONGOOSE
                                  │
                   ┌──────────────┴──────────────┐
                   │                             │
              MONGODB ATLAS               NODEMAILER (SMTP)
          (Blogs, Subscribers)          (Broadcasts to Users)
```
