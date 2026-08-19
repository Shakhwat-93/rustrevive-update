# ==============================================================================
# RUST & REVIVE — MULTI-STAGE PRODUCTION DOCKERFILE (COOLIFY / VPS)
# Architecture: Next.js 15 Standalone + Node.js 22 Alpine
# ==============================================================================

# 1. Base Stage
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN mkdir -p /app/public

# 2. Dependencies Stage
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 3. Builder Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public

# Build-time environment variables for Next.js static asset compilation
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_URL="https://rustrevive.store"
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-anon-key"
ENV NEXT_PUBLIC_MEDIA_URL="https://pub-90e6c63b53cb4c518fdafb3bfeb44169.r2.dev"
ENV SUPABASE_SERVICE_ROLE_KEY="placeholder-service-role-key"
ENV R2_ACCOUNT_ID="placeholder-r2-account"
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
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start Next.js standalone server
CMD ["node", "server.js"]
