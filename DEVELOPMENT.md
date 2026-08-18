# Rust & Revive — Developer & Operational Handbook
**Environment:** Next.js 15, TypeScript Strict, Supabase, Cloudflare R2, Docker  

---

## 1. Local Prerequisites
- **Node.js:** v20.x or v22.x LTS (v24.x supported)
- **NPM:** v10.x+
- **Docker & Docker Compose:** Docker Engine 24+ / Compose V2

---

## 2. Quickstart & Installation

```bash
# 1. Clone the repository
git clone https://github.com/rustrevive/rustrevive-next.git
cd rustrevive-next

# 2. Install dependencies (using frozen lockfile)
npm ci

# 3. Create local environment configuration
cp .env.example .env.local

# 4. Start local development server
npm run dev
```
The application will be accessible at: [http://localhost:3000](http://localhost:3000)  
Healthcheck endpoint: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 3. Core Quality & Verification Commands

| Command | Purpose |
| :--- | :--- |
| `npm run lint` | Runs ESLint to check for style and TypeScript violations |
| `npm run typecheck` | Executes `tsc --noEmit` to verify 100% strict TypeScript types |
| `npm run test` | Executes the automated Vitest test suite |
| `npm run test:watch` | Starts Vitest in interactive watch mode for TDD |
| `npm run build` | Produces the standalone optimized production bundle in `.next/standalone` |

---

## 4. Environment Variables Overview

See [`.env.example`](file:///c:/projects/rustrevive-next/.env.example) for the full variable specification.

### Key Classifications:
1. **`NEXT_PUBLIC_*` (Browser & Server):**
   - Safe to expose in client-side bundles.
   - Example: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MEDIA_URL`.
2. **Server-Only Secrets (Never in Browser):**
   - Strictly guarded via `server-only` and `src/config/env.ts`.
   - Example: `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.

---

## 5. Docker Local Development & Production Verification

```bash
# Build and run the local container stack
docker compose -f docker/docker-compose.local.yml up --build

# Run production container simulation
docker build -t rustrevive-web -f docker/Dockerfile.app .
docker run -p 3000:3000 --env-file .env.local rustrevive-web
```

---

## 6. Architecture & Subsystem Guides
- System Architecture: [`ARCHITECTURE.md`](file:///c:/projects/rustrevive-next/ARCHITECTURE.md)
- Database & Migrations: [`DATABASE.md`](file:///c:/projects/rustrevive-next/DATABASE.md)
- Storage & Cloudflare R2: [`STORAGE.md`](file:///c:/projects/rustrevive-next/STORAGE.md)
- Security & Threat Model: [`SECURITY.md`](file:///c:/projects/rustrevive-next/SECURITY.md)
- VPS Deployment & Backup: [`DEPLOYMENT.md`](file:///c:/projects/rustrevive-next/DEPLOYMENT.md)
