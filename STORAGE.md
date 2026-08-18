# Rust & Revive — Media Storage & Cloudflare R2 Architecture (Refined)
**Version:** 1.1.0-PROD  
**Storage Provider:** Cloudflare R2 (S3-Compatible Object Store)  
**Edge CDN Layer:** Cloudflare Edge (`https://media.rustrevive.store`)  
**Upload Pipeline:** Direct Client-to-R2 via S3 Presigned URLs  

---

## 1. Edge Delivery vs R2 Storage Decoupling

```
                      +───────────────────────────────────────────────+
                      |         CLOUDFLARE EDGE (CDN / CACHE)         |
                      |   - Custom Domain: `media.rustrevive.store`   |
                      |   - Global Tiered Cache (300+ Edge PoPs)      |
                      |   - Auto WebP/AVIF Edge Polish / Resizing     |
                      |   - Immutable Cache Header (1 Year TTL)       |
                      +───────────────────────┬───────────────────────+
                                              │
                                              │ Cache Miss / Origin Fetch
                                              ▼
                      +───────────────────────────────────────────────+
                      |         CLOUDFLARE R2 OBJECT STORAGE          |
                      |   - S3 API-Compatible Distributed Bucket      |
                      |   - Stores Master Immutable Originals         |
                      |   - $0 Egress Bandwidth Fees                  |
                      |   - Private Access (Restricted to CDN & API)  |
                      +───────────────────────────────────────────────+
```

### 1.1 Cloudflare Edge Caching Rules
- **Cache-Control Header:** `public, max-age=31536000, immutable` (Set during R2 upload metadata).
- **Edge TTL:** 1 Year.
- **Cache Invalidation:** Because all keys are content-hashed and UUID-named, cache invalidation is never required; new uploads receive new URLs, eliminating stale asset bugs.

---

## 2. Direct Browser-to-R2 Presigned Upload Workflow

Large image files (5MB–15MB high-resolution product photography) bypass the Next.js VPS container entirely:

```
[ Admin Browser ]
       │
       │ 1. User selects image (e.g. `raw_jacket_shoot.png`, 8.4MB)
       │    - Browser performs client-side validation (MIME, size <= 15MB, magic bytes)
       │
       │ 2. POST /api/storage/presign (Sends MIME: `image/png`, Size: 8808038, Category: `products`)
       ▼
[ Next.js Server (Route Handler) ]
       │ 3. Verifies GoTrue Admin Auth Session (Role: `admin` | `manager`)
       │ 4. Generates UUIDv4 and Safe S3 Key: `products/2026/08/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d.png`
       │ 5. S3Client generates Presigned PutObjectCommand URL (Valid for 15 minutes)
       │    - Restricts Content-Type, Content-Length range, and Cache-Control headers
       ▼
[ Admin Browser ]
       │ 6. Receives `{ uploadUrl, storageKey, publicUrl }`
       │
       │ 7. Direct HTTP PUT binary to Cloudflare R2 endpoint
       ▼
[ Cloudflare R2 Storage ]
       │ 8. Validates Presigned Signature, stores object, returns HTTP 200 OK + ETag
       ▼
[ Admin Browser ]
       │ 9. Receives 200 OK from R2
       │
       │ 10. Calls Server Action: `confirmMediaUploadAction({ storageKey, publicUrl, altText })`
       ▼
[ Next.js Server ]
       │ 11. S3 HeadObject Verification: Queries R2 to ensure file exists, matches expected size & ETag
       │ 12. Executes INSERT INTO `media` table in PostgreSQL via Supabase connection
       ▼
[ Supabase PostgreSQL ]
       │ 13. Returns new Media Entity ID for instant attachment to Product / Variant
       ▼
[ Admin UI ] Shows thumbnail preview and success indicator
```

---

## 3. Media Processing & Variant Generation Analysis

### 3.1 Comparison of Processing Architectural Options

| Option | Architecture | VPS Resource Impact | Latency Impact | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Synchronous inside Next.js Server Action** | Next.js receives file stream, runs Sharp multi-size WebP generation, uploads 4 variants to R2 | **High (CPU Spikes)** — Consumes multiple vCPUs, blocks Node.js event loop, starves storefront SSR | Adds 2–4s delay to user upload request | ❌ **Rejected for Production** |
| **Option B: Heavy Redis + BullMQ Dedicated Worker** | Next.js pushes job to Redis; separate Worker Node.js process runs Sharp | **Moderate (RAM Overhead)** — Requires Redis daemon (100MB+) and persistent background Node worker (150MB+) | Asynchronous (Zero delay on upload) | ⚠️ **Viable but over-complex for single VPS** |
| **Option C: Direct Upload + On-Demand Edge Resizing / Async DB Queue** | Direct upload master original to R2; Cloudflare Edge Resizing transforms variants on request; or lightweight Postgres-backed background worker (`p-limit`, `nice -n 19`) | **Zero to Ultra-Low VPS Impact** — Offloads transcoding to Cloudflare Edge or throttles local compute | Instant upload response, variants generated seamlessly | ✅ **Selected Production Architecture** |

### 3.2 Chosen Production Strategy:
1. **Master Original Storage:** Direct presigned upload stores full-resolution master in R2.
2. **Edge Resizing & WebP/AVIF Generation:** Cloudflare Edge Image Resizing / Worker delivers dynamically requested dimensions (e.g. `https://media.rustrevive.store/cdn-cgi/image/width=800,format=auto/products/...`) cached for 1 year at the edge.
3. **VPS Fallback Worker:** If edge transformation is bypassed, a throttled background job in PostgreSQL generates variants during low-traffic windows without impacting storefront responsiveness.
