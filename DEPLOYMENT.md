# Rust & Revive — VPS & Production Deployment Architecture (Refined)
**Version:** 1.1.0-PROD  
**Host Environment:** Ubuntu 24.04 LTS VPS  
**Network Architecture:** Isolated Docker Bridge + Hardened Ingress Proxy  

---

## 1. Network Perimeter & Port Exposure Matrix

```
[ THE INTERNET ]
       │
       ├── Port 80 (HTTP)   ──> [ Host Caddy ] (301 Permanent Redirect to HTTPS)
       └── Port 443 (HTTPS) ──> [ Host Caddy ] (TLS 1.3 Termination, Reverse Proxy)
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │                  DOCKER BRIDGE: `rustrevive_internal_net`               │
 │                  (Zero host port bindings; isolated subnet)             │
 │                                                                         │
 │  ┌─────────────────────────┐           ┌─────────────────────────────┐  │
 │  │ `rustrevive-web`        │           │ `supabase-kong`             │  │
 │  │ (Next.js 15 Standalone) │           │ (Supabase API Gateway)      │  │
 │  │ Internal Port: 3000     │           │ Internal Port: 8000         │  │
 │  └────────────┬────────────┘           └──────────────┬──────────────┘  │
 │               │                                       │                 │
 │               │                                       ▼                 │
 │               │                        ┌─────────────────────────────┐  │
 │               │                        │ `supabase-auth` (GoTrue)    │  │
 │               │                        │ Internal Port: 9999         │  │
 │               │                        └──────────────┬──────────────┘  │
 │               │                                       │                 │
 │               │                                       ▼                 │
 │               │                        ┌─────────────────────────────┐  │
 │               │                        │ `supabase-rest` (PostgREST) │  │
 │               │                        │ Internal Port: 3000         │  │
 │               │                        └──────────────┬──────────────┘  │
 │               │                                       │                 │
 │               │                                       ▼                 │
 │               └───────────────────────>┌─────────────────────────────┐  │
 │                Supavisor / Direct TCP  │ `supabase-pooler`           │  │
 │                                        │ (Supavisor Transaction Pool)│  │
 │                                        │ Internal Port: 6543         │  │
 │                                        └──────────────┬──────────────┘  │
 │                                                       │                 │
 │                                                       ▼                 │
 │                                        ┌─────────────────────────────┐  │
 │                                        │ `supabase-db`               │  │
 │                                        │ (PostgreSQL 15.6)           │  │
 │                                        │ Internal Port: 5432         │  │
 │                                        └──────────────┬──────────────┘  │
 └───────────────────────────────────────────────────────┼─────────────────┘
                                                         ▼
                                          [ Named Persistent Volume ]
                                          `supabase_db_data`
```

### 1.1 Ingress Host Exposure Rules
- **Publicly Accessible via Caddy:**
  - `rustrevive.store` (Next.js Application)
  - `api.rustrevive.store` (Supabase Kong Gateway — strictly routes Auth & PostgREST)
- **Strictly Internal / Loopback Only:**
  - `supabase-db` (Port 5432 is **NEVER** exposed to the internet).
  - `supabase-pooler` (Port 6543 internal).
  - `supabase-auth` (Port 9999 internal).
  - `supabase-rest` (Port 3000 internal).
  - `supabase-studio` (Bound to `127.0.0.1:3001` on VPS loopback; access requires SSH Tunnel: `ssh -L 3001:127.0.0.1:3001 user@vps_ip` or Caddy IP allowlist with HTTP Basic Authentication).

---

## 2. Decoupled Compose Stacks & Zero-Data-Loss Architecture

```
/opt/rustrevive/
├── infra/                          # STACK A: State & Database (Untouched during App deployments)
│   ├── docker-compose.infra.yml    # Runs PostgreSQL 15.6, Supavisor, GoTrue, PostgREST, Kong
│   └── .env.infra                  # Declares persistent named volume: `supabase_db_data`
├── app/                            # STACK B: Stateless Application (Safely redeployed)
│   ├── docker-compose.app.yml      # Runs `rustrevive-web` container only
│   └── .env.production             # Connected to external Docker network: `rustrevive_internal_net`
└── scripts/
    ├── deploy.sh                   # App redeploy script (rebuilds & restarts web container only)
    ├── backup-db.sh                # Nightly cron executing pg_dump -> GPG encrypt -> push to R2
    └── test-restore-db.sh          # Automated monthly backup integrity verification runner
```

---

## 3. Automated Backup, Verification & Restore Strategy

```
[ Scheduled Host Cron (02:00 UTC) ]
                 │
                 ▼
[ Step 1: Database Snapshot ]
- Executes `pg_dump -Fc` from `supabase-db`
- Compresses with `gzip -9`
                 │
                 ▼
[ Step 2: Client-Side GPG Encryption ]
- Encrypts archive with AES-256 (`gpg --symmetric --cipher-algo AES256`)
                 │
                 ▼
[ Step 3: Offsite Streaming to Cloudflare R2 ]
- Streams encrypted payload (`db_backup_YYYYMMDD_HHMMSS.dump.gz.enc`)
- Destination: Private Cloudflare R2 Bucket (`rustrevive-db-backups`)
                 │
                 ▼
[ Step 4: Retention Pruning ]
- Retains last 7 days of local snapshots on VPS NVMe
- Cloudflare R2 Bucket Lifecycle Policy automatically retains snapshots for 90 days
                 │
                 ▼
[ Step 5: Automated Restore Verification Drill (`test-restore-db.sh`) ]
- Monthly cron spins up temporary ephemeral container `test-postgres-verify`
- Decrypts latest R2 backup, restores schema & tables
- Runs SQL validation assertions (counts users, products, orders)
- Tears down verification container and sends health alert
```
