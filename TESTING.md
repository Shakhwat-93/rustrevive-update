# Rust & Revive — Automated Testing & Quality Assurance Strategy
**Version:** 1.0.0-PROD  
**Test Frameworks:** Vitest (Unit & Integration) + Playwright (End-to-End)  
**Target Coverage:** >85% Business Logic, 100% Security & Financial Checkout Flows  

---

## 1. Testing Pyramid & QA Strategy

```
           / \
          /   \     [ E2E Tests: Playwright ]
         / E2E \    - Checkout flow, Guest to Order, Admin Product Upload
        /-------\
       /  INTEG  \  [ Integration Tests: Vitest + Testcontainers / Local Supabase ]
      /  RATION   \ - Database Transactions, RLS Policies, StorageService, R2 Uploads
     /-------------\
    /  UNIT TESTS   \ [ Unit Tests: Vitest ]
   /                 \- Price Calculations, Cart Reducers, Zod Validators, Currency
  +-------------------+
```

---

## 2. Test Suite Breakdown

### 2.1 Unit Tests (`/tests/unit`)
- **Cart & Price Math (`currency.test.ts`, `cart.test.ts`):**
  - Verify zero floating point errors with integer-cents math.
  - Test coupon discount calculations: percentage discounts, fixed-amount discounts, maximum discount caps, minimum spend thresholds.
  - Tax calculation by jurisdiction and shipping fee tiered logic.
- **Zod Validator Tests (`validators.test.ts`):**
  - Test invalid product SKUs, malformed image URLs, XSS payloads in product titles, negative prices.
- **Image Key Sanitizer (`storage-key.test.ts`):**
  - Test unicode stripping, path traversal rejection (`../../etc/passwd`), special character sanitization.

### 2.2 Integration Tests (`/tests/integration`)
- **Inventory Concurrency & Overselling Prevention (`inventory-concurrency.test.ts`):**
  - Simulate 10 simultaneous checkout requests attempting to buy the last 2 remaining units of a vintage jacket variant.
  - Assert that exactly 2 checkouts succeed and 8 fail gracefully with `OUT_OF_STOCK` error.
- **RBAC Security Matrix (`rbac.test.ts`):**
  - Assert that an unauthenticated request to an Admin Server Action throws `401 Unauthorized`.
  - Assert that a user with `role: 'customer'` calling `createProductAction()` receives `403 Forbidden`.
  - Assert that `role: 'admin'` successfully creates and updates catalog entities.
- **StorageService S3/R2 Pipeline (`storage.test.ts`):**
  - Verify presigned URL signing format, headers, expiration time.
  - Test buffer uploads, MIME detection, and deletion calls.

### 2.3 End-to-End (E2E) Tests (`/tests/e2e`)
- **Flow 1: Guest Customer Complete Checkout:**
  - Visit Homepage -> Browse Category 'Jackets' -> Select Variant 'Size L' -> Add to Cart -> Open Slideout Cart -> Proceed to Checkout -> Enter Address -> Mock Stripe Payment -> Reach Order Confirmation Page (`RR-2026-XXXXX`).
  - Verify stock ledger decrements in database.
- **Flow 2: Admin Media & Product Management:**
  - Admin Login -> Open Media Library -> Upload Test Product Image -> Create New Product with 2 Variants -> Publish Product -> Verify Product appears in Storefront catalog with correct Cloudflare R2 media URL.

### 2.4 Production Smoke & Health Checks (`/tests/smoke`)
- Executes automated HTTP probe against production VPS post-deployment:
  - `GET /api/health` returns `200 OK` with database pool status.
  - `GET /` returns `200 OK` with valid HTML payload.
  - `HEAD https://media.rustrevive.store/brand/logo-light.svg` returns `200 OK`.
