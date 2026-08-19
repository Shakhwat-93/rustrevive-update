# ==============================================================================
# RUST & REVIVE — MULTI-STAGE PRODUCTION DOCKERFILE (COOLIFY / VPS)
# Architecture: Next.js 15 Standalone + Node.js 22 Alpine
# ==============================================================================

# 1. Base Stage
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables needed during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL="https://rustrevive.store"
ENV NEXT_PUBLIC_SUPABASE_URL="http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im45NXVnejBscXg3Nm1waGViMHN4YWFhMiIsInJvbGUiOiJwb2xpY3kiLCJpYXQiOjE3NzA3MzQyMTcsImV4cCI6MjA4NjMxMDIxN30.K9s2m46Yw1Bv-x5Kz_y9xZ0kQ-7_w9vK6y_vK6y_vK4"
ENV SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im45NXVnejBscXg3Nm1waGViMHN4YWFhMiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3NzA3MzQyMTcsImV4cCI6MjA4NjMxMDIxN30.i9w7881cO2YjZq4rX_h8kQ2_z_l9yX0kQ-7_w9vK6y_vK6y_vK4"
ENV R2_ACCOUNT_ID="d74dd7a21d47d4eb876eb76eafab664d"
ENV R2_BUCKET_NAME="rustandrevive"

# Run standalone production build
RUN npm run build

# 4. Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public directory and standalone artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
