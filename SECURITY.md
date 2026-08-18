# Rust & Revive — Security Architecture & Threat Model
**Version:** 1.0.0-PROD  
**Compliance Standard:** OWASP Top 10, Strict Least Privilege, Zero Trust Client  

---

## 1. Multi-Layered Defense Model

Rust & Revive employs defense-in-depth across five security perimeters:

```
[Layer 1: Edge Perimeter]      --> Cloudflare WAF, DDoS mitigation, SSL (TLS 1.3), HSTS
[Layer 2: Ingress Proxy]       --> Caddy / Nginx rate limiting, security headers, reverse proxy isolation
[Layer 3: App Edge & Runtime]  --> Next.js Middleware (JWT cookie validation, route gating)
[Layer 4: Business Logic]      --> Server Actions Zod schema validation, RBAC verification, CSRF protection
[Layer 5: Database Layer]      --> PostgreSQL Row Level Security (RLS), Service Role containment, SQL parameterization
```

---

## 2. Authentication & Session Architecture

1. **Authentication Engine:** Supabase GoTrue (Self-Hosted on VPS).
2. **Session Storage:**
   - Tokens (`access_token`, `refresh_token`) are stored in secure, `HttpOnly`, `SameSite=Lax`, `Secure` cookies managed via `@supabase/ssr`.
   - JavaScript in the browser **never** has access to raw tokens, completely eliminating XSS token theft.
3. **Session Refresh:** Handled automatically in Next.js Middleware before route evaluation. Expired tokens are refreshed transparently or redirected to `/auth/login`.

---

## 3. RBAC & Admin Authorization Flow

Every administrative action is guarded at three independent checkpoints:

```
                  +----------------------------------------------+
                  |  Admin Request (/admin/products/new)         |
                  +----------------------+-----------------------+
                                         |
                                         v
   +-----------------------------------------------------------------------------+
   | CHECKPOINT 1: Next.js Edge Middleware                                       |
   | - Decodes Supabase session cookie                                           |
   | - Checks if user exists; if null -> redirect to /auth/login                 |
   | - Fast user role verification (cached claims / DB lookup)                   |
   | - If role NOT IN ('admin', 'manager') -> 403 Forbidden / Redirect           |
   +-------------------------------------+---------------------------------------+
                                         | PASS
                                         v
   +-----------------------------------------------------------------------------+
   | CHECKPOINT 2: Server Action / Route Handler Auth Guard                      |
   | - Invokes `requireAdminPermission('products:write')`                        |
   | - Re-fetches fresh user roles from DB to prevent stale session privileges   |
   | - Validates input payload against strict Zod Schema                         |
   +-------------------------------------+---------------------------------------+
                                         | PASS
                                         v
   +-----------------------------------------------------------------------------+
   | CHECKPOINT 3: PostgreSQL Database Layer                                     |
   | - Client requests executed via Supabase authenticated user context (RLS)    |
   | - Privileged mutations executed via isolated `supabaseAdmin` service role    |
   | - Audit log entry emitted atomically in transaction                         |
   +-----------------------------------------------------------------------------+
```

---

## 4. Secret Management & Key Isolation

| Secret Variable | Target Environment | Scope | Exposed to Browser? |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | App Runtime | Public API Endpoint | **YES** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App Runtime | Client Supabase Init | **YES** (Constrained by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js Server / Backend | Admin Operations, Ledger writes | **NO (STRICTLY FORBIDDEN)** |
| `POSTGRES_PASSWORD` | Docker VPS Compose | Database internal connection | **NO (STRICTLY FORBIDDEN)** |
| `R2_ACCESS_KEY_ID` | Next.js Server | Cloudflare S3 API | **NO (STRICTLY FORBIDDEN)** |
| `R2_SECRET_ACCESS_KEY` | Next.js Server | Cloudflare S3 API | **NO (STRICTLY FORBIDDEN)** |
| `STRIPE_SECRET_KEY` | Next.js Server | Payment processing | **NO (STRICTLY FORBIDDEN)** |
| `STRIPE_WEBHOOK_SECRET` | Next.js Server | Webhook signature verification | **NO (STRICTLY FORBIDDEN)** |

### Strict Enforcement:
- Server-only secrets are placed in `.env.local` (local) or injected via Docker Environment files (`.env.production`) on the VPS.
- Next.js build-time audits ensure no variable lacking `NEXT_PUBLIC_` is imported into client components (`import "server-only"` guard).

---

## 5. Input Validation & Injection Prevention

1. **Zod Runtime Schema Validation:**
   - Every Server Action and API Route Handler validates its input using Zod before calling services or queries.
   - Strip unrecognized properties automatically (`.strict()` or default stripping).
2. **SQL Injection Protection:**
   - Supabase PostgREST and parameterized query builders ensure 100% parameterization of SQL inputs.
   - Raw string concatenation in SQL queries is strictly banned in code reviews.
3. **XSS Protection:**
   - React 19 / Next.js auto-escapes HTML strings by default.
   - For rich editorial product descriptions, an allowlist-based sanitizer (e.g., `DOMPurify` / `sanitize-html`) strips script tags, iframes, inline event handlers (`onload`, `onerror`).

---

## 6. Secure Media Upload Protection

1. **Magic Byte Inspection:** File uploads are verified via file signature / magic bytes, not untrusted file extensions sent by the client.
2. **Strict MIME Allowlist:** Only `image/jpeg`, `image/png`, `image/webp`, `image/avif` are accepted. SVG uploads from general users are disallowed to prevent stored XSS attacks via XML/SVG payloads.
3. **Payload Size Bounds:** Hard cap of 15MB per raw image file enforced in reverse proxy, API route, and S3 presigned policy constraints.
4. **Key Path Sanitization:** Filenames are never used as storage keys. All keys use cryptographically generated UUIDs.

---

## 7. HTTP Security Headers & Rate Limiting

The application serves strict production HTTP headers:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://media.rustrevive.store data: blob:; connect-src 'self' https://*.supabase.co https://api.rustrevive.store;
```

### Rate Limiting Policies:
- **Authentication Routes (`/api/auth/*`, Login Actions):** Max 5 attempts per 15 minutes per IP.
- **Checkout & Payment Endpoints:** Max 10 attempts per minute per IP/Session.
- **Public Product Catalog / Search:** Max 120 requests per minute per IP.
