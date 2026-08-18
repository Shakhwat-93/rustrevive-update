# Rust & Revive — System Architecture Specification (Refined Production Baseline)
**Version:** 1.1.0-PROD  
**Document Status:** Complete & Production Refined  
**Author:** Lead Software Architect & Technical Product Engineer  

---

## 1. Top-Level Infrastructure & Topology

The platform enforces clean separation between Edge, Compute, State, and Object Storage:

```
                                  [ INTERNET CLIENTS ]
                                            │
                                            ▼
                    +─────────────────────────────────────────────────+
                    │            CLOUDFLARE EDGE PLATFORM             │
                    │   - Global Anycast DNS                          │
                    │   - WAF, DDoS Mitigation, TLS 1.3 Termination   │
                    │   - Cache Rules & HTTP/3 Acceleration           │
                    +───────────────────────┬─────────────────────────+
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               │                                                         │
      [ Web & API Traffic ]                                     [ Dynamic Media Traffic ]
      `rustrevive.store`                                        `media.rustrevive.store`
      `api.rustrevive.store`                                             │
               │                                                         ▼
               ▼                                        +─────────────────────────────────+
+───────────────────────────────────────────────+       │      CLOUDFLARE R2 BUCKET       │
│               HOST VPS (SERVER)               │       │  (Zero-Egress Object Storage)   │
│                                               │       │                                 │
│  +─────────────────────────────────────────+  │       │  - Product High-Res Originals   │
│  │ Caddy 2 Ingress Reverse Proxy           │  │       │  - Processed Responsive WebP    │
│  │ (Host Ports 80 & 443 Only)              │  │       │  - Lookbooks & Hero Banners     │
│  +────────────────────┬────────────────────+  │       +─────────────────────────────────+
│                       │                       │                        ▲
│       ┌───────────────┴───────────────┐       │                        │
│       │ Internal Docker Bridge Net    │       │                        │ Direct Browser S3 PUT
│       │ (`rustrevive_internal_net`)   │       │                        │ (Presigned URL)
│       ▼                               ▼       │                        │
│  +─────────────────+  +────────────────────+  │                        │
│  | `rustrevive-web`|  | Self-Hosted        |  |                        │
│  | Next.js 15 App  |  | Supabase Stack     |  │                        │
│  | (Stateless)     |  | - Kong (API Ingress)  │                        │
│  | (Port 3000 Int) |  | - GoTrue (Auth)    |  │                        │
│  |                 |  | - PostgREST        |  │                        │
│  | - SSR & ISR     |  | - Supavisor / Pool |  │                        │
│  | - Server Actions|  | - PostgreSQL 15.6  |  │                        │
│  | - Zero Loc Media|  |   (Port 5432 Int)  |  │                        │
│  +────────┬────────+  +─────────┬──────────+  │                        │
│           │                     │             │                        │
│           └─────────────────────┘             │                        │
│            Supavisor / Direct TCP             │                        │
│                                               │                        │
│  [Named Persistent Volume: `supabase_db_data`]│                        │
+───────────────────────────────────────────────+────────────────────────┘
```

---

## 2. Media Architecture: Cloudflare Edge vs Cloudflare R2

### 2.1 Distinct Infrastructure Layers
1. **Cloudflare Edge (CDN / Caching Layer):**
   - Intercepts requests to `media.rustrevive.store`.
   - Caches images globally across 300+ PoPs based on `Cache-Control: public, max-age=31536000, immutable`.
   - Serves cached assets without touching the R2 storage bucket, achieving single-digit millisecond latency for repeat visits.
   - Cloudflare Polish / Image Resizing can optionally perform on-demand format negotiation (WebP/AVIF) and resizing at the edge.
2. **Cloudflare R2 (Object Storage Origin):**
   - High-durability, distributed object store holding immutable asset files.
   - Zero egress bandwidth fees regardless of storefront traffic.
   - Private bucket; public access is restricted strictly to Cloudflare CDN routing via custom domain binding.

---

## 3. Direct R2 Presigned Upload & Image Processing Architecture

### 3.1 Direct Upload Flow (Zero VPS Memory/Bandwidth Exhaustion)
Large image files (raw 5MB–15MB DSLR uploads) never pass through the Next.js application container or VPS RAM:

```
[ Admin Browser ]
       │
       │ 1. POST /api/storage/presign (Sends filename, MIME, size, sha256)
       ▼
[ Next.js Server ]
       │ 2. Authenticate Admin session via GoTrue cookie
       │ 3. Validate MIME type & file size (Zod)
       │ 4. Generate S3 Presigned PUT URL with 15-minute expiration
       ▼
[ Admin Browser ]
       │ 5. Direct HTTP PUT raw binary payload
       ▼
[ Cloudflare R2 ] (Returns HTTP 200 OK + ETag)
       │
       ▼
[ Admin Browser ]
       │ 6. Call Server Action: `confirmMediaUploadAction(key, metadata)`
       ▼
[ Next.js Server ]
       │ 7. S3 HeadObject check: Verify file exists in R2 and matches ETag & size
       │ 8. INSERT INTO `media` in Supabase PostgreSQL
       ▼
[ Database ] (Media record confirmed and linked to product)
```

### 3.2 Media Processing & Optimization Strategy
**Decision:** **Hybrid Client-Side Pre-Optimization + On-Demand Edge Pipeline (or Async Background Job)**
- **Why NOT in Next.js synchronous requests?** Processing multi-resolution images (400w, 800w, 1600w WebP) inside Next.js Server Actions spikes VPS CPU, blocks the Node.js event loop, and starves storefront SSR requests.
- **Production Pipeline:**
  1. *Client-side Pre-Validation:* Browser validates file signature (magic bytes), dimensions, and MIME type before presign request.
  2. *Direct Upload to R2:* High-res master image is uploaded to `media.rustrevive.store/originals/...`.
  3. *Optimization Delivery:* 
     - **Primary:** Cloudflare Edge Image Resizing / Custom Worker automatically generates WebP/AVIF variants on-demand and caches them at the edge for 1 year.
     - **Alternative (VPS-contained):** An asynchronous worker queue (via PostgreSQL job queue / background task) picks up new media records, runs Sharp at lowest CPU priority (`nice -n 19`), generates variants, streams them back to R2, and updates the `media` record.

---

## 4. Self-Hosted Supabase Production Stack

### 4.1 Component Breakdown & Exposure Perimeter

| Service Container | Image / Technology | Role | Network Binding | Exposed to Internet? |
| :--- | :--- | :--- | :--- | :--- |
| **`supabase-db`** | `supabase/postgres:15.6.1.138` | Relational DB with extensions (`pgcrypto`, `pgjwt`, `uuid-ossp`, `pg_stat_statements`) | `rustrevive_internal_net:5432` | **NO (Internal Only)** |
| **`supabase-pooler`** | `supabase/supavisor:1.1.1` | High-throughput connection pooler (Transaction mode) | `rustrevive_internal_net:6543` | **NO (Internal Only)** |
| **`supabase-auth`** | `supabase/gotrue:v2.158.0` | JWT authentication, session cookies, password hashing | `rustrevive_internal_net:9999` | **NO (Via Kong only)** |
| **`supabase-rest`** | `postgrest/postgrest:v12.0.2` | RESTful API engine auto-generated from PostgreSQL schema | `rustrevive_internal_net:3000` | **NO (Via Kong only)** |
| **`supabase-realtime`** | `supabase/realtime:v2.28.0` | Elixir-based WebSocket server for live inventory/order sync | `rustrevive_internal_net:4000` | **NO (Via Kong only)** |
| **`supabase-meta`** | `supabase/postgres-meta:v0.80.0` | Internal DB metadata query service for Studio | `rustrevive_internal_net:8080` | **NO (Internal Only)** |
| **`supabase-kong`** | `kong:2.8.1` | API Gateway routing auth, rest, and realtime | `rustrevive_internal_net:8000` | **YES (Proxied via Caddy on `api.rustrevive.store`)** |
| **`supabase-studio`** | `supabase/studio:20240729` | Web Dashboard GUI | `127.0.0.1:3001` (Host loopback only) | **NO (VPN / SSH Tunnel / IP Allowlist + Basic Auth)** |
| **`supabase-storage`** | *N/A (Disabled)* | *Supabase local storage is disabled in favor of Cloudflare R2* | *N/A* | **NO** |

---

## 5. PostgreSQL Version Selection & Rationale

- **Selected Engine:** **PostgreSQL 15.6 (`supabase/postgres:15.6.1.138`)**
- **Rationale:**
  1. PostgreSQL 15.x is the primary stable release line powering self-hosted Supabase production installations.
  2. All required Supabase C extensions (`pgjwt`, `pg_graphql`, `pg_stat_statements`, `pgcrypto`, `uuid-ossp`, `pg_net`) are compiled, optimized, and regression-tested against PG 15.6.
  3. Superior query planner optimizations for complex multi-table joins and JSONB indexing compared to older releases.

---

## 6. Database Connection Strategy

```
Next.js Application (SSR / Server Components / Data Fetching)
  ├── Reads / Queries (Catalog, Lookbooks, Banners)
  │     └── Supabase PostgREST Client (HTTP/2 keep-alive via Kong)
  │         - Zero connection hold time on PostgreSQL pool
  │         - High concurrency, low memory footprint
  │
  └── Mutations & ACID Transactions (Checkout, Inventory, Orders, Admin Writes)
        └── Direct Connection Pooler (Supavisor / Direct TCP via postgres.js/Drizzle)
            - Connection string: `postgresql://postgres:...@supabase-pooler:6543/postgres`
            - Mode: Transaction Pooling (`pool_size: 20`, `max_overflow: 10`)
            - Supports `BEGIN ... SELECT FOR UPDATE ... COMMIT` atomic transactions
```
