# Database Architecture & Mongoose Schemas: CMS

This document defines the database architecture, mongoose models, indexing strategy, and relational mapping within the CMS project. The application utilizes a **MongoDB Atlas NoSQL** cluster accessed via the **Mongoose ODM**.

---

## 1. Relational Mapping & Modeling Concept

Unlike traditional SQL databases or heavy MongoDB designs that use `ObjectId` references, this application operates on a **decoupled string-key reference system**. 

The primary identifier linking blogs to engagement tracking records (likes, views) is the **Blog URL Slug** (`blogSlug`), stored as a string:

```
                  ┌────────────────────────┐
                  │          Blog          │
                  ├────────────────────────┤
                  │ _id: ObjectId          │
                  │ slug: String (Unique)  │◄────────┐
                  │ ...                    │         │
                  └────────────────────────┘         │
                                                     │
         ┌───────────────────┴───────────────────┐   │  (String Ref)
         ▼                                       ▼   │
┌─────────────────┐                     ┌─────────────────┐
│      Like       │                     │      View       │
├─────────────────┤                     ├─────────────────┤
│ _id: ObjectId   │                     │ _id: ObjectId   │
│ blogSlug: String├─────────────────────┼─────────┐       │
│ visitorId: String                     │ visitorId: String
└─────────────────┘                     └─────────────────┘
```

This design choice allows:
- **Fast lookups**: Directly queries the `Like` and `View` collections using the slug retrieved from the URL route parameter, avoiding intermediate blog ID queries.
- **Easy migrations**: Slugs remain readable and independent of database-generated ObjectIds.

---

## 2. Detailed Mongoose Schemas

### A. Blog Model (`src/models/Blog.ts`)
Stores the main content of articles, categorization, and aggregate statistics.

```typescript
const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["tech", "fitness", "life", "motivation"],
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    coverImage: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt fields
  }
);
```

#### Performance Indexes:
1. `{ createdAt: -1 }`: Optimizes the homepage query listing the latest 3 articles.
2. `{ category: 1, createdAt: -1 }`: Optimizes filtered listings on the directory page (`/blogs`) sorting by date within a specific category.

---

### B. Like Model (`src/models/Like.ts`)
Tracks unique post likes to prevent double-voting.

```typescript
const LikeSchema = new mongoose.Schema(
  {
    blogSlug: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
```

#### Performance & Business Rules:
- **Compound Unique Index**: `{ blogSlug: 1, visitorId: 1 }` is defined with `{ unique: true }`. This guarantees that a user (represented by `visitorId`) can toggle their like for a post (represented by `blogSlug`) without race conditions resulting in duplicate entries.

---

### C. View Model (`src/models/View.ts`)
Logs unique post view counts, filtering out repetitive page refreshes.

```typescript
const ViewSchema = new mongoose.Schema(
  {
    blogSlug: {
      type: String,
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);
```

#### Performance & Business Rules:
- **Compound Unique Index**: `{ blogSlug: 1, visitorId: 1 }` is marked `{ unique: true }`. If a visitor reloads a blog post, subsequent logs fail on this index constraint, ensuring views are only incremented once per unique visitor.

---

### D. Subscriber Model (`src/models/Subscriber.ts`)
Houses email addresses signed up for the automated email newsletter.

```typescript
const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate email subscriptions
    },
  },
  { timestamps: true }
);
```

---

### E. RateLimit Model (`src/models/RateLimit.ts`)
A lightweight, high-performance database collection designed to log client requests and prevent API abuse.

```typescript
const RateLimitSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60, // TTL Index: MongoDB automatically drops documents after 60 seconds
    },
  },
  { timestamps: false }
);
```

#### Performance & Core Mechanics:
1. **TTL Index (Time-To-Live)**: The `expires: 60` flag on `createdAt` enables MongoDB's background task to automatically purge rate limit entries exactly one minute after creation, resetting the rate limits without cron jobs.
2. **Compound Unique Index**: `{ ip: 1, endpoint: 1 }` with `{ unique: true }`. It allows atomic lookups and increments.
3. **Atomic Operations**: Employs MongoDB's `$inc` operator in an upsert style query to increment counts without read-before-write race conditions.
