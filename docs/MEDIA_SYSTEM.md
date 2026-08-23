# Rust & Revive — Permanent Production Media System Specification

## 1. Executive Architecture

The Rust & Revive media architecture connects PostgreSQL metadata directly with Cloudflare R2 storage and Next.js Image optimization through a streaming edge gateway.

```
PostgreSQL (`media` table)
       ↓
`object_key` (e.g. `products/2026/08/{uuid}_{name}.webp`)
       ↓
`getMediaUrl()` -> `/api/media/[...path]` or `https://media.rustrevive.store/...`
       ↓
Cloudflare R2 Bucket (`rustandrevive`)
       ↓
`next/image` with Immutable Edge Caching
       ↓
Browser (Zero 400s, Zero Broken Icons)
```

---

## 2. Standardized Object Key Structure

All image object keys follow a strict immutable namespace:
- **Products**: `products/{YYYY}/{MM}/{uuid}_{sanitized_basename}.webp`
- **Categories**: `categories/{categoryId}/{uuid}.webp`
- **Collections**: `collections/{collectionId}/{uuid}.webp`
- **Homepage**: `homepage/{section}/{uuid}.webp`

---

## 3. Fallback & Safe Image Resolution

1. **Centralized Normalization**: `getMediaUrl(input)` maps raw keys, legacy `/uploads/` paths, and external CDN URLs into reliable canonical URLs.
2. **Verified Fallback Asset**: `public/placeholder-garment.webp` (8.2 KB WebP) is a verified local static asset that returns **HTTP 200** to Next.js Image Optimizer.
3. **Loop-Protected `<SafeImage />`**:
   - Renders canonical source.
   - On rare network failure, switches to fallback once without recursion.

---

## 4. Diagnostics & Maintenance

Run the automated media health diagnostic at any time:
```bash
# Internal Admin Diagnostic
GET /api/admin/media/health

# Sync and Verify R2 Assets
node scripts/sync-media-to-r2.mjs
```
