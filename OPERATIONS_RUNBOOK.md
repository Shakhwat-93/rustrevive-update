# 📖 Rust & Revive — Operations & Disaster Recovery Runbook

**System Architecture:** Next.js (Standalone) + Coolify + Self-Hosted Supabase / PostgreSQL + Cloudflare R2 + Caddy Reverse Proxy  
**Production Domain:** `https://rustrevive.store`  
**Target RPO (Recovery Point Objective):** < 6 Hours  
**Target RTO (Recovery Time Objective):** < 30 Minutes  

---

## 1. Zero-Downtime Deployment Procedure

When pushing updates to production via Coolify / Git webhook:

1. **Build Step:** Coolify triggers Docker build in an isolated image.
2. **Health Check Validation:**
   ```bash
   curl -f http://localhost:3000/api/health || exit 1
   ```
3. **Traffic Shift:** Reverse proxy (Caddy / Traefik) routes traffic to the newly verified container only after `200 OK` is confirmed.
4. **Graceful Termination:** Old container is gracefully stopped after lingering connections drain.

---

## 2. Automated Database Backup & Export

Run automated database snapshots using the verified Node.js exporter:

```bash
# Generate timestamped JSON dump of all 30 application tables
node scripts/backup-db.mjs
```

### Offsite Replication Recommendation:
Sync the `backups/` folder daily to Cloudflare R2 backup bucket or secure S3 cold storage:
```bash
# Example sync command
aws s3 sync ./backups s3://rustrevive-db-backups/ --endpoint-url https://d74dd7a21d47d4eb876eb76eafab664d.r2.cloudflarestorage.com
```

---

## 3. Disaster Recovery: Complete VPS Rebuild

If the primary VPS hardware fails or is destroyed:

### Phase A: Infrastructure Re-provisioning
1. Provision a clean Ubuntu 24.04 LTS VPS instance.
2. Install Coolify:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
3. Restore Self-Hosted Supabase stack in Coolify using the repository's `docker-compose.yml`.

### Phase B: Database Schema & Data Restoration
1. Apply base migrations in sequence:
   ```bash
   node scripts/apply-migrations.mjs
   ```
2. Verify table health:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```

### Phase C: Application Reconnection
1. Clone application repository: `git clone https://github.com/Shakhwat-93/rustrevive-update.git`
2. Populate `.env.production.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
3. Deploy application via Coolify or Docker Standalone.
4. Verify DNS records pointing to the new VPS IP.

---

## 4. Incident Response Playbooks

### Incident 1: Database Connection Failure (HTTP 500 on Checkout)
1. Check Supabase Kong Gateway status:
   ```bash
   curl http://supabasekong-.../rest/v1/
   ```
2. Check Supabase PostgREST logs in Docker:
   ```bash
   docker logs supabase-postgrest --tail 100
   ```
3. Reload schema cache if tables were updated:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### Incident 2: Cloudflare R2 Media Upload Fails
1. Verify token permissions (Object Read & Write enabled on Cloudflare dashboard).
2. Check R2 public CDN connectivity:
   ```bash
   curl -I https://pub-90e6c63b53cb4c518fdafb3bfeb44169.r2.dev/products/test.webp
   ```
3. Verify bucket name `rustandrevive` is intact.

### Incident 3: Memory / CPU Spike
1. Inspect container resource usage:
   ```bash
   docker stats --no-stream
   ```
2. Inspect Next.js health diagnostics:
   ```bash
   curl http://localhost:3000/api/health?details=true
   ```
3. If Node.js RSS memory exceeds 1.5GB, restart application container gracefully.

---

## 5. Security & Secret Rotation

- **Supabase Service Role Key:** Rotated in Supabase settings ➔ update `.env.local` ➔ restart app.
- **R2 API Tokens:** Generated in Cloudflare R2 ➔ update `.env.local` ➔ restart app.
- **Payment & Courier Webhooks:** Validate HMAC signatures strictly server-side.
