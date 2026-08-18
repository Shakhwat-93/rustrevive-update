# Multi-Stage Production Dockerfile for Next.js 15 Standalone
# Base Image
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat wget

# Stage 1: Dependencies Installation
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Stage 2: Application Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Dummy build-time environment variables for static validation
ENV NEXT_PUBLIC_SITE_URL="https://rustrevive.store"
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder-anon-key"
ENV NEXT_PUBLIC_MEDIA_URL="https://media.rustrevive.store"
ENV SUPABASE_SERVICE_ROLE_KEY="placeholder-service-role-key"
ENV R2_ACCOUNT_ID="placeholder-account-id"
ENV R2_ACCESS_KEY_ID="placeholder-access-key-id"
ENV R2_SECRET_ACCESS_KEY="placeholder-secret-access-key"
ENV R2_BUCKET_NAME="rustrevive-media-prod"

RUN npm run build

# Stage 3: Minimal Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root security user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
