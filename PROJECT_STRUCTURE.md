# Rust & Revive — Codebase & Project Structure Specification
**Version:** 1.0.0-PROD  
**Architecture:** Next.js 15 App Router, TypeScript Strict, Modular Domain Driven  

---

## 1. Top-Level Repository Structure

```
rustrevive-next/
├── .github/                      # CI/CD Workflows (Lint, Test, Docker Build, Deploy)
│   └── workflows/
│       ├── ci.yml                # Automated test & typecheck pipeline
│       └── deploy.yml            # VPS Deployment automation via SSH
├── docker/                       # Container Definitions & Local Compose
│   ├── Dockerfile.app            # Multi-stage production Next.js Dockerfile
│   ├── docker-compose.local.yml  # Local dev full stack (Next.js + Local Supabase)
│   └── docker-compose.prod.yml   # Production VPS application stack
├── infra/                        # VPS Infrastructure & Server Configs
│   ├── caddy/
│   │   └── Caddyfile             # Caddy reverse proxy host configuration
│   ├── nginx/
│   │   └── nginx.conf            # Optional Nginx alternative configuration
│   ├── supabase/                 # Self-hosted Supabase Docker configuration
│   │   ├── docker-compose.infra.yml
│   │   ├── .env.supabase.example
│   │   └── kong.yml              # Kong API Gateway route definitions
│   └── scripts/                  # Operational DevOps Shell Scripts
│       ├── deploy.sh             # Zero-downtime deploy runner
│       ├── backup-db.sh          # Encrypted PostgreSQL backup to Cloudflare R2
│       └── restore-db.sh         # Disaster recovery database restoration script
├── public/                       # Static Build-Time Assets (Zero User Uploads)
│   ├── brand/
│   │   ├── logo-light.svg        # Official Brand Logo (Light Theme)
│   │   ├── logo-dark.svg         # Official Brand Logo (Dark Theme)
│   │   └── favicon.ico
│   ├── fonts/                    # High-performance self-hosted WOFF2 fonts
│   └── site.webmanifest
├── src/                          # Application Source Code
│   ├── actions/                  # Server Actions (Mutations & Data Writes)
│   ├── app/                      # Next.js App Router (Layouts, Pages, Routes)
│   ├── components/               # React UI Component Hierarchy
│   ├── config/                   # Static Configuration & Constants
│   ├── hooks/                    # Reusable React Hooks (Client)
│   ├── lib/                      # Core Services, DB Clients, Storage, Utils
│   ├── styles/                   # Global CSS & Design Tokens
│   ├── types/                    # TypeScript Domain & Schema Definitions
│   └── middleware.ts             # Edge Middleware (Auth, Security, Route Guards)
├── supabase/                     # Supabase Migration & Seed Management
│   ├── migrations/               # Timestamped SQL DDL Migrations
│   │   ├── 20260819000001_init_rbac_and_users.sql
│   │   ├── 20260819000002_catalog_and_media.sql
│   │   ├── 20260819000003_inventory_and_orders.sql
│   │   ├── 20260819000004_marketing_and_cms.sql
│   │   └── 20260819000005_rls_security_policies.sql
│   ├── seeds/                    # Development & Initial Production Seeds
│   │   └── seed_initial_data.sql # Base roles, initial categories, test products
│   └── config.toml
├── tests/                        # Test Suites (Unit, Integration, E2E)
│   ├── e2e/                      # Playwright E2E Test Specs
│   ├── integration/              # Database & Service Integration Tests
│   └── unit/                     # Vitest Component & Utility Tests
├── .env.example                  # Documented Environment Variable Template
├── next.config.ts                # Next.js Advanced Production Configuration
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts            # Custom Editorial Tailwind Design System
├── tsconfig.json                 # Strict TypeScript Configuration
└── README.md
```

---

## 2. Source Code Modularization (`/src`)

### 2.1 `/src/app` (App Router Routing Structure)
- **`(storefront)`**: Public customer experience:
  - `page.tsx`: Editorial narrative homepage.
  - `products/page.tsx`: Catalog with multi-attribute filtering.
  - `products/[slug]/page.tsx`: High-fashion product showcase with variant picker.
  - `collections/[slug]/page.tsx`: Curated category showcases (Pants, T-Shirts, Belts, Jackets).
  - `cart/page.tsx`: Cart slide-over & page.
  - `checkout/page.tsx`: Multi-step checkout.
  - `account/page.tsx`: Order history & customer profile.
- **`(admin)`**: Protected administration suite:
  - `admin/page.tsx`: Revenue, order volume, inventory alerts.
  - `admin/products/*`: Product catalog manager, variant matrix, price editor.
  - `admin/categories/*`: Category visual tree manager.
  - `admin/orders/*`: Order fulfillment workflow, packing slip generator.
  - `admin/media/*`: Media library explorer & multi-file uploader.
  - `admin/inventory/*`: Inventory stock adjustments and ledger audit.
  - `admin/coupons/*`: Discount code engine.
  - `admin/settings/*`: Editorial banner manager, shipping rates, store metadata.
- **`api/`**: Route Handlers for system integrations:
  - `api/webhooks/payment/route.ts`: Webhook handler for payment processor.
  - `api/storage/presign/route.ts`: Cloudflare R2 presigned URL signer.
  - `api/health/route.ts`: VPS health check monitor.

### 2.2 `/src/components` (Component Hierarchy)
```
components/
├── ui/                           # Atomic Design Primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── skeleton.tsx
├── storefront/                   # Customer Facing Molecules & Organisms
│   ├── header/                   # Sticky Editorial Navbar, Currency, Search
│   ├── footer/                   # Editorial Footer & Newsletter
│   ├── product-card.tsx          # High-fashion Product Card with Hover States
│   ├── product-gallery.tsx       # Asymmetric / Editorial Product Image Showcase
│   ├── variant-selector.tsx      # Size & Color Pill Matrix
│   ├── cart-drawer.tsx           # Slide-out Quick Cart
│   └── hero-banner.tsx           # Full-bleed Editorial Campaign Hero
├── admin/                        # Admin Portal Molecules
│   ├── admin-sidebar.tsx         # Navigation Bar with Active Route Indicators
│   ├── admin-header.tsx          # Breadcrumbs & Admin Profile Pill
│   ├── data-table.tsx            # Server-side Filterable, Sortable Data Table
│   ├── image-dropzone.tsx        # Drag & Drop File Upload with Progress Indicator
│   └── order-status-badge.tsx    # Semantic State Badges
└── shared/                       # Cross-cutting UI Components
    ├── responsive-image.tsx      # Next/Image wrapper with BlurHash placeholder
    └── error-boundary.tsx        # Production Safe UI Crash Fallback
```

### 2.3 `/src/lib` (Domain Services & Utilities)
```
lib/
├── supabase/                     # Supabase SDK Wrappers
│   ├── client.ts                 # Browser client (Anon Key)
│   ├── server.ts                 # Server Component client (Cookie Session)
│   └── admin.ts                  # Service Role client (Privileged)
├── storage/                      # Storage Subsystem
│   ├── storage.interface.ts      # Abstract IStorageService contract
│   ├── r2-storage.service.ts     # S3-compatible Cloudflare R2 implementation
│   └── image-optimizer.ts        # Sharp format/resizing pipeline
├── auth/                         # Authentication & RBAC Helpers
│   ├── get-session.ts
│   └── require-role.ts           # Server Action authorization guard
├── validators/                   # Zod Schemas
│   ├── product.schema.ts         # Create/Update Product input validation
│   ├── checkout.schema.ts        # Order & Shipping address validation
│   └── coupon.schema.ts          # Coupon creation validation
└── utils/                        # Formatting & Calculation Helpers
    ├── currency.ts               # Cents -> Formatted String ($45.00)
    ├── slugify.ts                # URL-safe slug generator
    └── cn.ts                     # Tailwind class merge helper
```
