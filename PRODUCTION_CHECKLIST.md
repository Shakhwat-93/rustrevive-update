# 📋 Rust & Revive — Production Deployment Checklist

Use this checklist before triggering official production releases.

---

## 🔒 1. Security & Credentials
- [x] `.env.local` and `.env.production` excluded from Git repository (`.gitignore` verified).
- [x] Zero hardcoded JWT secrets, payment tokens, or R2 credentials in client bundles.
- [x] Server-only modules protected with `import "server-only"`.
- [x] Next.js Edge Rate Limiting active on checkout (15/min), admin (80/min), and webhooks (150/min).
- [x] Content-Security-Policy (CSP), HSTS, Frameguard, and X-Content-Type-Options active.
- [x] Row Level Security (RLS) enabled on all 30 PostgreSQL tables.

---

## 🗄️ 2. Database & Data Integrity
- [x] 3NF Normalized Schema applied (`20260819_001` through `20260819_005`).
- [x] Composite indexes active for fast product catalog filtering and order lookups.
- [x] PostgREST schema cache reloaded (`NOTIFY pgrst, 'reload schema'`).
- [x] Automated database backup script (`scripts/backup-db.mjs`) tested and generating valid dumps.

---

## 📦 3. Storage & Media
- [x] Cloudflare R2 bucket `rustandrevive` connected with S3 SDK.
- [x] R2 Public CDN `https://pub-90e6c63b53cb4c518fdafb3bfeb44169.r2.dev` registered in `next.config.ts` remote patterns.
- [x] Dynamic image optimization configured for WebP and AVIF.

---

## 🚀 4. Performance & Reliability
- [x] Liveness & Diagnostic Health check active at `/api/health`.
- [x] Standalone output bundle enabled in Next.js.
- [x] Load test benchmark (`scripts/load-test.mjs`) verified at 10 concurrency with 0% error rate.
- [x] React Hydration guards in place for header cart counters.

---

## 🔍 5. Commerce Workflows
- [x] Guest and Authenticated Checkout flow operational with atomic inventory reservation.
- [x] Cash On Delivery (COD) payment flow enabled.
- [x] Online Payment Provider Abstraction (SSLCommerz, bKash, Nagad, Stripe) ready for live credentials.
- [x] Courier provider abstraction (Steadfast, Pathao, RedX, In-house) with 2-factor parcel tracking at `/track-order`.
- [x] Discount Engine with server-side validation and coupon usage limit tracking.
- [x] Product reviews with verified purchase fraud protection and moderation queue at `/admin/reviews`.
- [x] Dynamic `sitemap.xml` and `robots.txt` generator active.
