# API Reference: CMS

This document specifies the serverless API endpoints for the CMS project. Developers and future AI models should refer to this guide to understand how to interact with the database layers, execute administrative mutations, trigger email actions, or track user interaction statistics.

---

## 1. Global API Conventions

- **Content Type**: All mutate requests (`POST`) expect a `Content-Type: application/json` header and send JSON request bodies.
- **Authorization**: Mutating routes (create, delete, update, media signing) are protected by Next.js cookies. An `admin` cookie must be present and match `"true"`.
- **Response Format**: Standard JSON payload return structure:
  ```json
  {
    "success": true,
    "data": {},
    "error": "Error message description (only if success is false)"
  }
  ```

---

## 2. Authentication Endpoints

### A. Login Admin
Authenticates the user and sets a secure cookie on the browser.
- **Endpoint**: `POST /api/auth/login`
- **Rate Limit**: Max 5 attempts per minute per IP.
- **Request Body**:
  ```json
  {
    "password": "plain_text_password"
  }
  ```
- **Success Response (`200 OK`)**:
  - Sets Cookie: `admin=true; HttpOnly; Secure (in production); SameSite=Strict; Path=/; Max-Age=28800 (8 Hours)`
  ```json
  {
    "success": true
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Incorrect password.
  - `429 Too Many Requests`: Rate limit exceeded.
  - `500 Internal Server Error`: Server connection configuration is missing.

### B. Logout Admin
Destroys the administrative cookie session.
- **Endpoint**: `POST /api/auth/logout`
- **Request Body**: None
- **Success Response (`200 OK`)**:
  - Clears Cookie: Sets `admin=""` with expiry date in the past (`new Date(0)`).
  ```json
  {
    "success": true
  }
  ```

---

## 3. Blog Management Endpoints

### A. List Blogs
Retrieves a paginated list of blog articles from the database.
- **Endpoint**: `GET /api/blog`
- **Query Parameters**:
  - `page` (number, default: `1`): The target page sequence.
  - `limit` (number, default: `10`): Number of records per page.
  - `category` (string, optional): Filter by `tech`, `fitness`, `life`, or `motivation`.
  - `excludeContent` (boolean, optional): If `true`, strips the heavy `content` HTML field from results (used for optimization when loading cards).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "603f9a72df...",
        "title": "My First Blog",
        "slug": "my-first-blog",
        "category": "tech",
        "tags": ["nextjs", "webdev"],
        "likes": 5,
        "views": 42,
        "createdAt": "2026-06-16T04:57:15.000Z",
        "updatedAt": "2026-06-16T04:57:15.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
  ```

### B. Create Blog
Creates a new post and alerts subscribers.
- **Endpoint**: `POST /api/blog/create`
- **Authorization**: Requires `admin=true` cookie.
- **Request Body**:
  ```json
  {
    "title": "My New Article",
    "content": "<h1>HTML Content string...</h1>",
    "category": "fitness",
    "tags": ["workout", "health"],
    "coverImage": ""
  }
  ```
- **Processing Logic**: 
  - Sanitizes the input title to construct an alphanumeric lowercase string slug (e.g., `"my-new-article"`).
  - Triggers email broadcasts to all entries in the `Subscriber` collection using a styled HTML template.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "603f9f8cdf...",
      "title": "My New Article",
      "slug": "my-new-article",
      "content": "<h1>HTML Content string...</h1>",
      "category": "fitness",
      "tags": ["workout", "health"],
      "likes": 0,
      "views": 0,
      "createdAt": "2026-06-16T05:01:05.000Z"
    }
  }
  ```

### C. Update Blog
Updates an existing post by ID.
- **Endpoint**: `POST /api/blog/update`
- **Authorization**: Requires `admin=true` cookie.
- **Request Body**:
  ```json
  {
    "_id": "603f9f8cdf...",
    "title": "Updated Article Title",
    "content": "<p>Updated content</p>",
    "category": "life",
    "tags": ["habits", "productivity"]
  }
  ```
- **Processing Logic**: Regenerates the URL slug if the title has been updated.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "603f9f8cdf...",
      "title": "Updated Article Title",
      "slug": "updated-article-title",
      "content": "<p>Updated content</p>",
      "category": "life",
      "tags": ["habits", "productivity"],
      "createdAt": "2026-06-16T05:01:05.000Z",
      "updatedAt": "2026-06-16T05:02:11.000Z"
    }
  }
  ```

### D. Delete Blog
Removes a post from the database by ID.
- **Endpoint**: `POST /api/blog/delete`
- **Authorization**: Requires `admin=true` cookie.
- **Request Body**:
  ```json
  {
    "id": "603f9f8cdf..."
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```

---

## 4. User Engagement Endpoints

### A. Toggle Like
Toggles a post like state for a visitor.
- **Endpoint**: `POST /api/blog/like`
- **Rate Limit**: Max 30 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "slug": "target-post-slug",
    "visitorId": "uuid-visitor-string"
  }
  ```
- **Processing Logic**: 
  - Searches for a `Like` matching `slug` + `visitorId`.
  - If it exists: Deletes the record, decrements the Blog `likes` counter by 1, returns `liked: false`.
  - If it does not exist: Creates the record, increments the Blog `likes` counter by 1, returns `liked: true`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "likes": 6,
    "liked": true
  }
  ```

### B. Track View
Registers a page view for a visitor.
- **Endpoint**: `POST /api/blog/view`
- **Rate Limit**: Max 30 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "slug": "target-post-slug",
    "visitorId": "uuid-visitor-string"
  }
  ```
- **Processing Logic**: 
  - Searches for a `View` record matching `slug` + `visitorId`.
  - If found: Returns current views count without incrementing.
  - If not found: Creates the record and increments the Blog `views` counter by 1.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "views": 43
  }
  ```

---

## 5. Newsletter Endpoints

### A. Subscribe Newsletter
Signs up an email address to the subscribers list.
- **Endpoint**: `POST /api/subscribe`
- **Rate Limit**: Max 5 requests per minute per IP.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```
- **Error Response (`500 Internal Error`)**:
  - Returned if the email address is already subscribed or format validation fails.

### B. Unsubscribe Link
Deletes an email address from the subscriber database.
- **Endpoint**: `GET /api/unsubscribe`
- **Query Parameters**:
  - `email` (string): The URL-encoded email address to remove.
- **Response**: Returns a fully styled HTML web page confirming unsubscription status (`Content-Type: text/html`).

---

## 6. Media Endpoints

### A. Generate Media Upload Signature
Signs an asset upload request for direct browser-to-Cloudinary uploading.
- **Endpoint**: `POST /api/media/sign`
- **Authorization**: Requires `admin=true` cookie.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "signature": "df2a38bca56a...",
    "timestamp": 1718532456,
    "cloudName": "doctgquyo",
    "apiKey": "433317154997913",
    "folder": "my-cms-blogs"
  }
  ```
