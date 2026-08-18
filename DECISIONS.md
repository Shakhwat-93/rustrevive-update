# Rust & Revive — Architecture Decision Records (Refined Baseline)
**Document Status:** Approved Architectural Baseline (Step 1 Refined)  
**Version:** 1.1.0-PROD  

---

## ADR-001: Next.js 15 (App Router, React 19, TypeScript)
- **Decision:** Use Next.js 15 standalone container with React Server Components, Server Actions, and strict TypeScript.
- **Rationale:** Sub-100ms storefront rendering via SSR/ISR, zero client hydration overhead on static editorial pages, robust SEO capabilities, and secure server-only execution boundaries.

---

## ADR-002: Self-Hosted Supabase Stack & PostgreSQL 15.6
- **Decision:** Deploy stable self-hosted Supabase using official `supabase/postgres:15.6.1.138` with Supavisor connection pooling (`supabase/supavisor:1.1.1`), GoTrue (`supabase/gotrue`), and Kong API Gateway.
- **Rationale:** Complete data sovereignty on our VPS with zero vendor row limits. Postgres 15.6 is the validated, stable production target for all Supabase extensions (`pgjwt`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`). Supabase local storage is explicitly disabled in favor of Cloudflare R2.
- **Studio Security:** Supabase Studio is strictly bound to `127.0.0.1:3001` (VPS loopback) and is accessible only via SSH tunneling or an IP-allowlisted Caddy proxy with HTTP Basic Authentication.

---

## ADR-003: Cloudflare Edge vs Cloudflare R2 Decoupled Separation
- **Decision:** Architecturally and visually separate Cloudflare Edge (CDN, WAF, DNS, Cache Rules) from Cloudflare R2 (Object Storage Origin).
- **Rationale:** High-durability master assets reside in private R2 ($0 egress fees), while global client requests to `media.rustrevive.store` are served from Cloudflare Edge cache points of presence (PoPs) with 1-year immutable caching.

---

## ADR-004: Direct Browser-to-R2 Presigned Upload & Non-Blocking Image Processing
- **Decision:** Uploads flow directly from Admin Browser -> Cloudflare R2 using AWS S3 Presigned `PutObject` URLs signed by Next.js. Media optimization is handled via Cloudflare Edge Resizing / async processing rather than blocking Next.js synchronous requests.
- **Rationale:** Prevents high-resolution multi-megabyte DSLR photography uploads from passing through Next.js container RAM or blocking the Node.js event loop with CPU-intensive Sharp processing.

---

## ADR-005: Dual-Path Database Access Strategy (PostgREST + Supavisor Pooler)
- **Decision:** Use PostgREST over HTTP/2 for stateless read queries and server component rendering, and use Supavisor connection pooling on port 6543 (transaction mode) for complex multi-table mutations and ACID checkout locks (`SELECT FOR UPDATE`).
- **Rationale:** Eliminates PostgreSQL connection exhaustion in concurrent serverless/container environments while maintaining ACID transactional integrity for financial and inventory operations.

---

## ADR-006: Hardened Docker Network Perimeter & Volume Isolation
- **Decision:** Split infrastructure into two isolated Docker compose stacks: `docker-compose.infra.yml` (Stateful Supabase & persistent volumes) and `docker-compose.app.yml` (Stateless Next.js). Only Caddy ports 80/443 are publicly bound.
- **Rationale:** Completely protects database data from accidental destruction (e.g., `docker compose down -v` in the app directory) and ensures no internal database ports (5432, 6543, 9999) are exposed to the public internet.

---

## ADR-007: Automated Encrypted Backup & Offsite R2 Vault
- **Decision:** Nightly automated `pg_dump -Fc` compressed snapshots encrypted via AES-256 GPG and synchronized offsite to an isolated Cloudflare R2 backup bucket (`rustrevive-db-backups`), paired with monthly automated container restoration drills.
- **Rationale:** Ensures multi-region disaster recovery resilience where VPS disk failure never compromises store data.
