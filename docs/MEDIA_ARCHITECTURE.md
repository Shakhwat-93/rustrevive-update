# Rust & Revive — Production Media Architecture

## 1. Architectural Overview

Rust & Revive uses a modern, cloud-native media storage and content delivery architecture designed for high throughput, sub-50ms latency, zero layout shift (CLS), and permanent durability across redeployments and container restarts.

```
+------------------+         +-------------------------------+
|  Admin / User    | ------> |  POST /api/admin/media/upload |
|  Image Upload    |         |  - MIME Validation            |
+------------------+         |  - Sharp Auto-WebP Conversion |
                             |  - UUID Key Generation        |
                             +---------------+---------------+
                                             |
                                             v
                             +-------------------------------+
                             |  Cloudflare R2 Bucket         |
                             |  Bucket: `rustandrevive`      |
                             |  (Immutable Storage)          |
                             +---------------+---------------+
                                             |
                                  [Confirmed HTTP 200]
                                             |
                                             v
                             +-------------------------------+
                             |  Supabase PostgreSQL          |
                             |  - `media` Record             |
                             |  - `product_media` Link       |
                             +---------------+---------------+
                                             |
                                             v
+------------------+         +-------------------------------+
|  Storefront /    | <------ |  GET /api/media/[...path]     |
|  Browser Client  |         |  - Immutable Edge Caching     |
|  (`next/image`)  |         |  - WebP Native Streaming      |
+------------------+         +-------------------------------+
```

---

## 2. Storage Principles & Rules

1. **Zero Local Filesystem Dependency**:
   - The application container filesystem is ephemeral. Media is **NEVER** stored in `public/uploads` or on local VPS disk.
   - All assets reside permanently in Cloudflare R2 bucket `rustandrevive`.
2. **Database Separation**:
   - PostgreSQL stores **only metadata**: `object_key`, `public_url`, `file_size`, `mime_type`, `width`, `height`, `alt_text`.
   - PostgreSQL **never** stores binary blobs.
3. **Transaction Safety**:
   - Database media records are inserted **only after** Cloudflare R2 returns a confirmed HTTP 200 upload response.
4. **Immutable Object Key Namespacing**:
   - Never use raw user filenames. All keys use timestamp + UUID:
     - Products: `products/{YYYY}/{MM}/{uuid}_{sanitized_basename}.webp`
     - Categories: `categories/{categoryId}/{uuid}.webp`
     - Collections: `collections/{collectionId}/{uuid}.webp`
     - Homepage: `homepage/{section}/{uuid}.webp`

---

## 3. High-Performance Edge Delivery

### Streaming Gateway: `/api/media/[...path]`
- **Cache-Control**: `public, max-age=31536000, immutable`
- **ETag Validation**: Supports `If-None-Match` returning `304 Not Modified`.
- **MIME Streaming**: Automatic `image/webp` detection.

### Next.js Image Optimization
Configured in `next.config.ts`:
```ts
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [
    { protocol: "https", hostname: "media.rustrevive.store", pathname: "/**" },
    { protocol: "https", hostname: "rustrevive.store", pathname: "/**" },
    { protocol: "https", hostname: "rustrevive.com", pathname: "/**" },
    { protocol: "https", hostname: "pub-90e6c63b53cb4c518fdafb3bfeb44169.r2.dev", pathname: "/**" },
    { protocol: "http", hostname: "localhost", pathname: "/**" },
  ],
}
```

---

## 4. Canonical URL Helper (`getMediaUrl`)

All storefront components import and use `getMediaUrl()` from `@/lib/media/media-url`:
```ts
import { getMediaUrl } from "@/lib/media/media-url";

// Resolves to: /api/media/products/...webp or https://media.rustrevive.store/...
const src = getMediaUrl(product.imageUrl);
```

---

## 5. Disaster Recovery & Media Synchronization

To sync or verify all local images directly to Cloudflare R2:
```bash
node scripts/sync-media-to-r2.mjs
```
This utility:
1. Validates all PostgreSQL media rows.
2. Ensures corresponding objects exist in Cloudflare R2.
3. Normalizes all URLs to canonical streaming edge routes.
