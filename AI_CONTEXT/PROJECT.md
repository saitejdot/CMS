# PROJECT.md — CMS v2

## What This Is

A personal blog and content management system for **Naga Sai Teja Bollimuntha** — a developer, writer, and content creator.

The project consists of two parts:
1. **Public website** (`tejwrites.vercel.app`) — blog reading, contact, and story exploration.
2. **Private CMS** — a password-protected admin dashboard to write and publish content.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Database | MongoDB Atlas via Mongoose 9 |
| Auth | JWT (jose) + HTTP-only cookies |
| Rate Limiting | Upstash Redis (@upstash/ratelimit) |
| Validation | Zod |
| Email | Nodemailer (SMTP/Gmail) |
| Hosting | Vercel |

## Major Features

### Public
- Homepage with Story Carousel, profile, and latest blogs
- Blog listing with search and category filtering
- Individual blog reading with views and likes
- Email subscription
- Contact page with social links

### Private CMS
- Admin login with JWT sessions
- Blog CRUD (create, read, update, delete)
- Custom rich text editor (legacy — to be replaced in Phase 2)
- Subscriber list management
- Email broadcast on blog publish

## Repository

GitHub: https://github.com/saitejdot/CMS  
Branch `main` = v1 (current production)  
Branch `cms-v2-phase1a` = v2 development

## Phase Status

See `AI_CONTEXT/IMPLEMENTATION_STATUS.md` for current progress.
