# API_REFERENCE.md

## Public APIs (Unauthenticated)

### `GET /api/blog`
- **Purpose**: Fetch all published blogs.
- **Auth**: None
- **Response**: `{ success: boolean, data: Blog[] }`

### `GET /api/banners`
- **Purpose**: Fetch list of banners.
- **Auth**: None
- **Response**: `{ success: boolean, data: string[] }` (URLs)

### `POST /api/blog/like`
- **Purpose**: Toggle a like for a blog by a specific visitor.
- **Auth**: None
- **Rate Limit**: 30 requests / 1 minute / IP
- **Payload Limit**: 2 KB
- **Request Body**: `{ slug: string, visitorId: string (UUID) }`
- **Response**: `{ success: boolean, likes: number, liked: boolean }`
- **Errors**: 400 (Invalid), 404 (Not Found), 413 (Too Large), 429 (Too Many Requests)

### `POST /api/blog/view`
- **Purpose**: Record a view for a blog by a specific visitor (only counts once per visitor).
- **Auth**: None
- **Rate Limit**: 30 requests / 1 minute / IP
- **Payload Limit**: 2 KB
- **Request Body**: `{ slug: string, visitorId: string (UUID) }`
- **Response**: `{ success: boolean, views: number }`
- **Errors**: 400 (Invalid), 404 (Not Found), 413 (Too Large), 429 (Too Many Requests)

### `POST /api/subscribe`
- **Purpose**: Subscribe an email to the newsletter.
- **Auth**: None
- **Rate Limit**: 3 requests / 1 hour / IP
- **Payload Limit**: 1 KB
- **Request Body**: `{ email: string }`
- **Response**: `{ success: true }` (Silently succeeds for duplicates)
- **Errors**: 400 (Invalid), 413 (Too Large), 429 (Too Many Requests)

### `GET /api/subscribers`
- **Purpose**: Get the total count of subscribers.
- **Auth**: None
- **Response**: `{ success: true, count: number }`

### `GET /api/unsubscribe`
- **Purpose**: Unsubscribe an email. (Currently handles unsubscribes)
- **Query Param**: `email`

### `POST /api/auth/login`
- **Purpose**: Admin login, sets JWT cookie.
- **Auth**: None
- **Rate Limit**: 5 requests / 15 minutes / IP
- **Payload Limit**: 1 KB
- **Request Body**: `{ password: string }`
- **Response**: `{ success: true }` + `Set-Cookie` header
- **Errors**: 400 (Invalid), 401 (Unauthorized), 413 (Too Large), 429 (Too Many Requests)

### `POST /api/auth/logout`
- **Purpose**: Clear admin session cookie.
- **Auth**: None
- **Response**: `{ success: true }` + `Set-Cookie` header (Max-Age=0)

---

## Privileged APIs (Authenticated)

**All privileged APIs require:**
1. Valid JWT in `admin_token` cookie (checked by Middleware + `requireAdmin()`).
2. Valid `Origin` header (checked by CSRF protection).

### `POST /api/admin/blog/create`
- **Purpose**: Create a new blog post and email subscribers.
- **Auth**: Admin JWT required
- **CSRF**: Origin validation required
- **Payload Limit**: 5 MB (Temporary, for base64 legacy images)
- **Request Body**: 
  ```json
  {
    "title": "string",
    "content": "string (HTML)",
    "category": "tech | fitness | life | motivation",
    "tags": ["string"],
    "coverImage": "string (optional URL)"
  }
  ```
- **Response**: `{ success: true, data: Blog }`
- **Errors**: 400 (Invalid), 401/403 (Auth/CSRF failed), 413 (Too Large)

### `POST /api/admin/blog/update`
- **Purpose**: Update an existing blog post.
- **Auth**: Admin JWT required
- **CSRF**: Origin validation required
- **Payload Limit**: 5 MB (Temporary)
- **Request Body**: Same as create, plus `_id: "string (24 char hex)"`.
- **Response**: `{ success: true, data: Blog }`
- **Errors**: 400 (Invalid), 401/403 (Auth/CSRF failed), 404 (Not Found), 413 (Too Large)

### `POST /api/admin/blog/delete`
- **Purpose**: Delete a blog post.
- **Auth**: Admin JWT required
- **CSRF**: Origin validation required
- **Payload Limit**: 1 KB
- **Request Body**: `{ id: "string (24 char hex)" }`
- **Response**: `{ success: true }`
- **Errors**: 400 (Invalid), 401/403 (Auth/CSRF failed), 413 (Too Large)

### `GET /api/admin/subscribers`
- **Purpose**: Get full subscriber list with emails.
- **Auth**: Admin JWT required
- **Response**: `{ success: true, count: number, subscribers: [{ email: string, createdAt: date }] }`
- **Errors**: 401/403 (Auth failed)
