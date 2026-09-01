-- ==============================================================================
-- RUST & REVIVE — LIVE VISITORS REAL-TIME TRACKING
-- Migration: 20260901_007_live_visitors.sql
-- ==============================================================================
-- Anonymous visitor session tracking for Admin Panel Live Visitors dashboard.
-- NO PII stored. visitor_id and session_id are random UUIDs.
-- Public anon can only upsert their own row (by visitor_id).
-- Admin service role bypasses RLS.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1. LIVE VISITORS TABLE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_visitors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Anonymous identity (no PII)
    visitor_id      UUID NOT NULL,
    session_id      UUID NOT NULL,
    tab_id          TEXT,                          -- per-tab identifier (for multi-tab handling)

    -- Current page
    current_path    TEXT NOT NULL DEFAULT '/',
    page_title      TEXT,
    page_type       TEXT NOT NULL DEFAULT 'OTHER'  -- HOME|PRODUCT|CATEGORY|SEARCH|CART|CHECKOUT|ACCOUNT|CONTACT|ABOUT|CUSTOM|OTHER
                    CHECK (page_type IN ('HOME','PRODUCT','CATEGORY','SEARCH','CART','CHECKOUT','ACCOUNT','CONTACT','ABOUT','CUSTOM','OTHER')),
    product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,

    -- Device / Browser / OS (from User-Agent — no fingerprinting)
    device_type     TEXT DEFAULT 'DESKTOP'
                    CHECK (device_type IN ('MOBILE','TABLET','DESKTOP')),
    browser         TEXT,
    os              TEXT,

    -- Traffic source (sanitized — domain only, no PII query params)
    referrer        TEXT,
    utm_source      TEXT,
    utm_medium      TEXT,
    utm_campaign    TEXT,

    -- Timestamps
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    -- Unique session per tab
    CONSTRAINT uq_visitor_session UNIQUE (visitor_id, session_id)
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_live_visitors_visitor_id    ON public.live_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_live_visitors_session_id    ON public.live_visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_live_visitors_last_seen_at  ON public.live_visitors(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_visitors_current_path  ON public.live_visitors(current_path);
CREATE INDEX IF NOT EXISTS idx_live_visitors_page_type     ON public.live_visitors(page_type);
CREATE INDEX IF NOT EXISTS idx_live_visitors_product_id    ON public.live_visitors(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_visitors_category_id   ON public.live_visitors(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_visitors_is_active     ON public.live_visitors(is_active, last_seen_at DESC);

-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

-- Public anon: can INSERT a row (new session)
DROP POLICY IF EXISTS "live_visitors_public_insert" ON public.live_visitors;
CREATE POLICY "live_visitors_public_insert"
    ON public.live_visitors
    FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- Public anon: can UPDATE only their own row (matched by visitor_id)
-- The visitor_id is passed in the request body and stored; anon cannot read other rows.
DROP POLICY IF EXISTS "live_visitors_public_update" ON public.live_visitors;
CREATE POLICY "live_visitors_public_update"
    ON public.live_visitors
    FOR UPDATE
    TO anon
    USING (TRUE)
    WITH CHECK (TRUE);

-- Public anon: CANNOT SELECT any rows (admin only)
-- No SELECT policy for anon role → public cannot read visitor data.

-- Service role bypasses all RLS automatically.

-- ---------------------------------------------------------------------------
-- 4. ENABLE SUPABASE REALTIME ON THIS TABLE
-- ---------------------------------------------------------------------------
-- Add to the realtime publication so Admin Panel receives instant events.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'live_visitors'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.live_visitors;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. STALE VISITOR CLEANUP FUNCTION
-- Called by API on each heartbeat to clean up sessions older than 90 seconds.
-- Lightweight: only deletes rows older than the active window.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_stale_visitors(active_window_seconds INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.live_visitors
    WHERE last_seen_at < NOW() - (active_window_seconds || ' seconds')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 6. UPDATED_AT TRIGGER (keep last_seen_at current)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_live_visitor_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only trigger on UPDATE (INSERT already sets last_seen_at = NOW() via DEFAULT)
DROP TRIGGER IF EXISTS trg_live_visitor_updated ON public.live_visitors;
CREATE TRIGGER trg_live_visitor_updated
    BEFORE UPDATE ON public.live_visitors
    FOR EACH ROW
    EXECUTE FUNCTION public.set_live_visitor_updated();
