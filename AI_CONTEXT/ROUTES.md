# ROUTES.md

## Public Routes

| Path | Type | Purpose |
|---|---|---|
| `/` | Server Component | Homepage: carousel, profile, latest blogs, subscribe |
| `/blogs` | Client Component | Blog listing with search and category filters |
| `/blog/[slug]` | Server Component | Individual blog reading |
| `/contact` | Server Component | Social links and subscribe form |

## Protected Routes (require admin JWT)

| Path | Type | Purpose |
|---|---|---|
| `/admin` | Server Component | Admin dashboard (JWT verified server-side) |
| `/admin/login` | Client Component | Admin login form |

## Public API Routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/blog` | List all published blogs |
| GET | `/api/banners` | List banner media files for carousel |
| POST | `/api/blog/like` | Toggle like on a blog (rate limited) |
| POST | `/api/blog/view` | Record a view on a blog (rate limited) |
| POST | `/api/subscribe` | Subscribe an email (rate limited) |
| GET | `/api/subscribers` | Public subscriber COUNT only (no emails) |
| GET | `/api/unsubscribe` | Remove email from subscriber list |
| POST | `/api/auth/login` | Admin login (rate limited) |
| POST | `/api/auth/logout` | Clear admin session |

## Protected API Routes (require admin JWT — middleware + requireAdmin())

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/blog/create` | Create a new blog post |
| POST | `/api/admin/blog/update` | Update an existing blog post |
| POST | `/api/admin/blog/delete` | Delete a blog post |
| GET | `/api/admin/subscribers` | Full subscriber list with emails |

## Middleware Coverage

```
/admin/*       → JWT verification → redirect to /admin/login if invalid
/api/admin/*   → JWT verification → 401 if invalid
```

## Backward Compatibility (Planned — Phase 2)

The following redirects will be added when public routes are restructured:
```
/blogs         → /stories
/blog/[slug]   → /stories/[slug]
```
These redirects are NOT yet implemented. Current routes remain unchanged.

## Deprecated Routes (old — still exist, not yet removed)

The following routes existed in v1 and are now superseded by `/api/admin/*`.  
They still exist in the filesystem but are **no longer called by any frontend code**:
- `/api/blog/create` — superseded by `/api/admin/blog/create`
- `/api/blog/update` — superseded by `/api/admin/blog/update`
- `/api/blog/delete` — superseded by `/api/admin/blog/delete`

> [!NOTE]
> The old `/api/blog/create`, `/api/blog/update`, `/api/blog/delete` files still exist but are orphaned. They should be removed in a cleanup commit to avoid confusion.
