# ENVIRONMENT.md

## Environment Variables

All secrets must be provided via environment variables.  
**Never commit real values. Never hardcode in source. Never log.**

### Required for All Environments

| Variable | Purpose | How to obtain |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | MongoDB Atlas dashboard → Connect |
| `ADMIN_PASSWORD` | Admin login password | Choose a strong password |
| `JWT_SECRET` | JWT signing secret | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint | console.upstash.com → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | console.upstash.com → REST API |
| `EMAIL_USER` | Gmail address for notifications | Your Gmail account |
| `EMAIL_PASS` | Gmail app password | Google Account → Security → App Passwords |

### Optional

| Variable | Purpose | Default if absent |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Production URL for email links and CSRF | Falls back to `https://tejwrites.vercel.app` |

### Planned (Phase 1B+)

| Variable | Purpose | Required when |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Images/Stream | Phase 1B media migration |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API access | Phase 1B media migration |
| `RESEND_API_KEY` | Transactional email API | Phase 1B email overhaul |
| `AI_PROVIDER_API_KEY` | Ask Tej / Translation AI | Phase 4 |

## Local Development

Create `.env` in the project root (already in `.gitignore`).  
Copy `.env.example` as a template.

## Production (Vercel)

Add all required variables to:  
Vercel Dashboard → Project → Settings → Environment Variables

Set scope to **Production** for secrets that should only be active in production.  
Set scope to **Preview + Production** for variables needed in preview deployments.

## Security Rules

- `.env` is in `.gitignore` — confirm before every commit
- `.env.example` contains only variable NAMES — no real values
- Never print environment variable values in logs
- Rotate `JWT_SECRET` if you suspect it has been compromised (invalidates all sessions)
- Rotate `ADMIN_PASSWORD` if you suspect it has been compromised
