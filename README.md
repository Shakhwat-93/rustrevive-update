# RUST & REVIVE — Production Fashion E-Commerce

> **Raw, Timeless, Modern, Vintage-Inspired Fashion Label**  
> Official Domain: [https://rustrevive.store](https://rustrevive.store)

---

## 🏛️ Project Overview

Rust & Revive is a premium editorial fashion e-commerce web platform engineered for high performance, uncompromising brand identity, and scalable commerce operations.

### Core Stack
- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling & Design System:** Tailwind CSS v4, Custom Editorial Typography & Spacing System
- **Animation:** Framer Motion (restrained, 200–600ms micro-interactions)
- **Database & Auth:** Self-Hosted Supabase / PostgreSQL with Row Level Security (RLS)
- **Object Storage & CDN:** Cloudflare R2 + Cloudflare Edge Media Cache (`media.rustrevive.store`)
- **Deployment:** Vercel & Docker Standalone on VPS / Caddy Reverse Proxy

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ (LTS)
- npm 10+

### 2. Installation
```bash
# Clone the repository
git clone git@github.com:Shakhwat-93/rustrevive-update.git
cd rustrevive-update

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Verification & Build Commands

```bash
# Run linting
npm run lint

# Run strict TypeScript typechecking
npm run typecheck

# Run unit tests
npm run test

# Production build
npm run build

# Start production server
npm run start
```

---

## 🌐 Vercel Deployment Guide

1. Push code to your GitHub repository: `Shakhwat-93/rustrevive-update`
2. Import project in [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Next.js**
4. Root Directory: `./`
5. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://rustrevive.store` or Vercel preview domain)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MEDIA_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
6. Deploy!

---

## 📂 Project Architecture

```
src/
├── app/                      # Next.js 15 App Router pages & API routes
│   ├── layout.tsx            # Global layout with Google Fonts
│   ├── page.tsx              # Clean editorial homepage
│   └── api/health/           # Health check endpoint
├── components/
│   ├── brand/                # Official wordmark & logo variants
│   ├── navigation/           # Editorial header & mobile drawer
│   ├── editorial/            # 11 Clean homepage sections
│   └── ui/                   # Button & SectionHeader design tokens
├── config/                   # Runtime environment validation (Zod)
├── data/                     # Typed mock data (ready for Supabase)
├── lib/
│   ├── api/                  # Standard API responses
│   ├── errors/               # Operational error classes
│   ├── logging/              # Structured JSON logging
│   ├── storage/              # Cloudflare R2 Presigned S3 client
│   └── supabase/             # SSR browser/server Supabase clients
└── styles/                   # Global CSS & Tailwind v4 tokens
```

---

## 📜 License & Copyright

© 2026 Rust & Revive. All Rights Reserved.
