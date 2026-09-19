# ENVIRONMENT.md

## Environment Variables

All secrets must be provided via environment variables.  
**Never commit real values. Never hardcode in source. Never log.**

### Required for All Environments (Phase 1A+)

| Variable | Purpose | How to obtain |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | MongoDB Atlas dashboard → Connect |
| `ADMIN_PASSWORD` | Admin login password | Choose a strong password |
| `JWT_SECRET` | JWT signing secret | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint | console.upstash.com → REST API |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token | console.upstash.com → REST API |
| `NEXT_PUBLIC_BASE_URL` | Production URL for email links and CSRF | Falls back to `https://tejwrites.vercel.app` |

### Required for Phase 1B (Media & Email)

| Variable | Purpose | Permissions Needed |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier | N/A |
| `CLOUDFLARE_API_TOKEN` | Authorizes Image/Stream uploads | *Cloudflare Images (Read/Write)*, *Cloudflare Stream (Read/Write)* |
| `GMAIL_USER` | Gmail address for email delivery | Gmail Account |
| `GMAIL_APP_PASSWORD` | App Password for Gmail SMTP | Google Account -> Security -> App Passwords |
| `UNSUBSCRIBE_SECRET` | Sign opaque unsubscribe tokens | Random 32-byte string, similar to JWT_SECRET |

### Planned (Phase 4)
| Variable | Purpose |
|---|---|
| `AI_PROVIDER_API_KEY` | Ask Tej / Translation AI |

## Security Rules

- `.env` is in `.gitignore` — confirm before every commit.
- `.env.example` contains only variable NAMES — no real values.
- Never print environment variable values in logs.
- Rotate `JWT_SECRET` or `UNSUBSCRIBE_SECRET` if compromised.
- Rotate `ADMIN_PASSWORD` if compromised.
