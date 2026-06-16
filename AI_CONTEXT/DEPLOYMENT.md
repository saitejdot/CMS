# Deployment & Operations Manual: CMS

This document outlines the hosting platforms, build requirements, server caching configurations, external SaaS integrations, and environment variable requirements for deploying and managing the CMS project.

---

## 1. Hosting & Infrastructure Architecture

The application is deployed at [tejwrites.vercel.app](https://tejwrites.vercel.app). It utilizes a modern serverless model:

```
               ┌───────────────────────────────┐
               │         Vercel Edge           │
               │   (Static Assets & CDN HTML)  │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │    Vercel Serverless Lambdas   │
               │   (API Handlers & SSR Pages)  │
               └──────┬───────────────┬────────┘
                      │               │
  ┌───────────────────▼───┐       ┌───▼───────────────────┐
  │     MongoDB Atlas     │       │     Cloudinary CDN    │
  │  (Managed Database)   │       │   (Hosted Rich Media) │
  └───────────────────────┘       └───────────────────────┘
```

- **Next.js Host (Vercel)**: Deploys static HTML routes to Edge Locations, and triggers serverless Lambdas to execute API endpoints (`/api/*`) and SSR actions.
- **Database (MongoDB Atlas)**: Hosted on a shared cloud tier. Access is managed through connection caching inside the Lambda container context.
- **Media CDN (Cloudinary)**: Offloads media processing, storage, and video rendering tasks.

---

## 2. Dynamic Caching Strategy (ISR)

To achieve fast page loads without serving outdated content, the site uses **Incremental Static Regeneration (ISR)** on critical dynamic pages:

- **Target Files**:
  - [src/app/page.tsx](file:///c:/Users/bolli/OneDrive/Desktop/CMS/my-cms/src/app/page.tsx)
  - [src/app/blog/\[slug\]/page.tsx](file:///c:/Users/bolli/OneDrive/Desktop/CMS/my-cms/src/app/blog/%5Bslug%5D/page.tsx)
- **Configuration**: `export const revalidate = 60;`
- **Behavior**:
  - The compiler pre-renders these pages during the build process using data retrieved from MongoDB.
  - Vercel caches the generated HTML at the edge.
  - When a user requests the page, they are served the cached static page instantly.
  - After 60 seconds, the next incoming request triggers a background regeneration. Vercel calls MongoDB, rebuilds the page HTML, updates the edge cache, and serves the updated layout to subsequent visitors.

---

## 3. Environment Variables Specification

Ensure the following system variables are configured on the hosting platform.

| Variable Name | Description | Sensitivity | Example/Format |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | The connection string for the MongoDB cluster, including credentials. | **High** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname` |
| `EMAIL_USER` | Gmail account address used to distribute newsletter broadcasts. | **Medium** | `myname.info@gmail.com` |
| `EMAIL_PASS` | Gmail 16-character **App Password** (OAuth bypass). | **High** | `abcd efgh ijkl mnop` |
| `ADMIN_PASSWORD_HASH` | A pre-computed `bcrypt` hash of the administration login password. | **High** | `$2b$12$NM4TSUGTYRg3OjqsSjtB...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary target tenant account identifier. | **Low** | `doctgquyo` |
| `CLOUDINARY_API_KEY` | Public credential identifier for Cloudinary API requests. | **Medium** | `433317154997913` |
| `CLOUDINARY_API_SECRET`| Cryptographic private key used to sign client upload requests. | **High** | `yOTzrlUVbzLoFY60ew...` |
| `NEXT_PUBLIC_BASE_URL` | Public production base URL (used to generate mail links). | **Low** | `https://tejwrites.vercel.app` |

*Note: In local development, these variables reside in `.env.local`.*

---

## 4. Build & Runtime Execution

### A. Core Commands
The build script is run in the root of the subfolder `my-cms`:

- **Install Dependencies**: `npm install`
- **Local Development Server**: `npm run dev`
  - Starts Next.js on `http://localhost:3000`.
- **Production Build compilation**: `npm run build`
  - Runs the TypeScript compiler, analyzes routes, generates static params for existing posts, pre-renders ISR HTML files, and outputs build files to the `.next` directory.
- **Production Execution**: `npm run start`
  - Boots up the compiled Node production bundle (primarily for local validation).

### B. Dynamic Params Configuration
The blog detail page is set to compile static slugs at build time using the model:
```typescript
export async function generateStaticParams() {
  await connectDB();
  const blogs = await Blog.find().select("slug").lean();
  return blogs.map((blog) => ({ slug: blog.slug }));
}
```
This speeds up the load times for current posts. If a post is created *after* compilation, Next.js dynamically compiles it on the fly during the first visitor hit and caches it.

---

## 5. Third-Party Service Bindings

### A. Cloudinary Media Delivery
- **Direct Upload Flow**: Browser contacts `/api/media/sign` -> Server generates cryptographic signature using `CLOUDINARY_API_SECRET` + current timestamp + folder path -> Browser uploads directly via POST to `api.cloudinary.com/v1_1/<cloudName>/image/upload` -> Cloudinary returns secure URL.
- **Optimized Folders**: All media files are uploaded to the folder `my-cms-blogs` to keep the root directory structured.

### B. Nodemailer Email Broadcast
- **Protocol**: Standard SMTP over secure TLS.
- **Provider**: Google Workspace / Gmail SMTP (`service: "gmail"`).
- **Security Method**: Utilizes a Google App Password (bypassing Multi-Factor Authentication prompts safely for machine-to-machine transactional mails).
- **Execution Thread**: Email dispatch is run inline during post creation (`POST /api/blog/create`). If any network error occurs, it is trapped inside a local `catch` block to prevent interrupting the main post publication process.
