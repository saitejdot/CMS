# DEPLOYMENT.md

## Overview
The application is deployed on Vercel.

## Infrastructure

- **Compute/Hosting**: Vercel (Serverless Functions for APIs, Edge Middleware)
- **Database**: MongoDB Atlas
- **Rate Limiting/Cache**: Upstash Redis
- **Email**: Gmail SMTP (via Nodemailer)

## Environment Variables
See `AI_CONTEXT/ENVIRONMENT.md` for the full list of required variables. All secrets must be securely configured in the Vercel Project Settings.

## Build Process
- `npm run build` runs Next.js build.
- TypeScript strict mode and ESLint must pass for the build to succeed.

## Future Infrastructure (Phase 1B+)
- **Cloudflare**: Will be added for media hosting (Images/Stream).
- **AI Provider**: Will be added for Ask Tej and Translations.
