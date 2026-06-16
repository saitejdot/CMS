# Security Design & Risk Analysis: CMS

This document specifies the security controls, authentication mechanisms, sanitization pipelines, and rate limiting engines implemented in the CMS project, and details critical security risks discovered during system auditing.

---

## 1. Authentication & Session Security (With Critical Vulnerability)

The system employs a cookie-based session checking layout to authorize administrative actions:

```
  Admin Browser                             Next.js Backend Server
──────┬──────                                       ──────┬──────
      │  (1) POST /api/auth/login { password }            │
      ├──────────────────────────────────────────────────►│
      │                                                   │──┐ Verify with bcrypt
      │                                                   │  │ against ENV hash
      │                                                   │◄─┘
      │  (2) HTTP 200 OK (Set-Cookie: admin=true)         │
      │◄──────────────────────────────────────────────────┤
      │                                                   │
      │  (3) GET /admin (Includes 'admin' cookie)         │
      ├──────────────────────────────────────────────────►│
      │                                                   │──┐ Middleware reads cookie
      │                                                   │  │ and validates value
      │                                                   │◄─┘
      │  (4) Renders AdminClient Dashboard                │
      │◄──────────────────────────────────────────────────┤
```

### A. Session Cookie Settings
Upon successful authentication, the server generates a session cookie named `admin` with the value `"true"`. The configuration options:
- **`httpOnly: true`**: Prevents client-side scripts (including XSS vectors) from reading or accessing the cookie, neutralizing token theft attempts via script injections.
- **`secure: process.env.NODE_ENV === "production"`**: Forces the browser to transmit the cookie over secure HTTPS connections only.
- **`sameSite: "strict"`**: Guarantees that the browser does not send the cookie along with cross-site requests, mitigating Cross-Site Request Forgery (CSRF) attacks.
- **`maxAge: 28800 (8 hours)`**: Enforces session expiration to limit the impact of exposed terminal screens.

### B. [CRITICAL VULNERABILITY] Lack of Cookie Signature / Token Verification
> [!CAUTION]
> **Administrative Authentication Bypass Vulnerability**
>
> The application middleware ([middleware.ts](file:///c:/Users/bolli/OneDrive/Desktop/CMS/my-cms/src/middleware.ts)) and mutation handlers (`/api/blog/create`, `/api/blog/delete`, `/api/blog/update`, `/api/media/sign`) only verify the *presence* and *literal value* of the `admin` cookie (`value === "true"`).
>
> Because the cookie is **not cryptographically signed, encrypted, or compared against a server-side session or JWT**, anyone can bypass the entire admin authentication panel and gain full write/delete permissions on the blog database.
>
> **Attack Vector**:
> 1. Open the browser DevTools (F12) on the public site.
> 2. Create a manual cookie: `admin=true; path=/`.
> 3. Refresh the page or navigate to `/admin`. The middleware accepts the client-defined cookie, grants dashboard access, and allows API mutations.
>
> **Remediation Plan**:
> Reconfigure authentication to issue a cryptographically signed JSON Web Token (JWT) or a secure session ID stored in a server-side cache (e.g., Redis or database sessions), rather than validating a static plaintext cookie boolean.

---

## 2. Input Sanitization & Stored XSS Protection

Because the CMS supports writing articles in a rich text format, the system must render raw HTML strings to users. To defend against **Stored Cross-Site Scripting (XSS)**, the server processes all database inputs through a sanitization pipeline before execution in the DOM:

- **Library**: `isomorphic-dompurify`
- **Location**: [src/app/blog/\[slug\]/page.tsx](file:///c:/Users/bolli/OneDrive/Desktop/CMS/my-cms/src/app/blog/%5Bslug%5D/page.tsx)
- **Configuration Rules**:
  ```typescript
  const cleanContent = DOMPurify.sanitize(blog.content, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "style"],
  });
  ```
  - **Implicit Stripping**: The parser strips out `<script>`, `onload`, `onerror`, `javascript:`, and other scripting targets.
  - **Whitelisting**: Explicitly permits `iframe` elements and media attributes to support embedding videos (such as YouTube or Vimeo players) in posts.

---

## 3. Database-Backed Rate Limiting Engine

To prevent brute force login attempts, spam subscriptions, and request flooding (view/like farming), a database-driven rate limiter is integrated at the API level ([rateLimit.ts](file:///c:/Users/bolli/OneDrive/Desktop/CMS/my-cms/src/utils/rateLimit.ts)).

### A. Rate Limiting Enforcements
- **Admin Login (`/api/auth/login`)**: Max 5 attempts per minute.
- **Newsletter Subscription (`/api/subscribe`)**: Max 5 attempts per minute.
- **Toggle Like (`/api/blog/like`)**: Max 30 attempts per minute.
- **Track View (`/api/blog/view`)**: Max 30 attempts per minute.

### B. Technical Implementation
1. **Atomic Hit Tracking**: Uses MongoDB's atomic `findOneAndUpdate` with `$inc` and `upsert` options. This executes the hit logging and count checks in a single query transaction, preventing race condition bypasses.
2. **Auto-Purging TTL**: Employs a MongoDB TTL (Time-To-Live) index on `createdAt` matching `expires: 60`. MongoDB's database workers automatically delete logged records after 60 seconds, resetting the user's rate limits.
3. **Fail-Open Design (High Availability)**:
   ```typescript
   try {
     // rate limit database transactions...
   } catch (error) {
     console.error("Rate limiter processing error:", error);
     return { success: true, count: 0 }; // Fail-Open
   }
   ```
   If the database is slow or disconnected, the rate limiter catches the error and **fails-open**, allowing the request to proceed. This prevents database latency spikes from taking down the entire website.

---

## 4. NoSQL Query Injection Protections

The application connects to MongoDB using Mongoose schemas. Because schema properties define data types strictly (e.g., `slug` is a String, `likes` is a Number):
- Object parameters passed to Mongoose querying functions (e.g., `Blog.findOne({ slug })`) are cast to their schema-defined types.
- If an attacker passes a query object like `{ "$gt": "" }` to trigger NoSQL query bypasses, Mongoose throws a casting exception or strips the query selectors, preventing NoSQL injection attacks.

---

## 5. Media Upload Security

Images, videos, and audio clips are not processed directly by the application server, preventing Denial of Service (DoS) attacks from file buffering.

- **Authentication Guard**: Direct uploading requires a signature generated by `/api/media/sign`. The endpoint validates the user's administrative cookie before calculating the signature.
- **Signature Expiration**: The cryptographic signature includes a `timestamp` and is valid for a short window, preventing replay attacks.
- **Storage Isolation**: Files are restricted to the `my-cms-blogs` folder on Cloudinary, preventing directories from getting cluttered.
