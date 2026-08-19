-- ==============================================================================
-- RUST & REVIVE — FULFILLMENT, COURIER PROVIDERS & NOTIFICATIONS (Phase 7)
-- Schema: 3NF Normalized, Decoupled Courier Providers, Audit-Ready
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. COURIER PROVIDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courier_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE, -- 'STEADFAST', 'PATHAO', 'REDX', 'CUSTOM'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    configuration JSONB NOT NULL DEFAULT '{}'::JSONB, -- Non-sensitive provider config
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Courier Providers
INSERT INTO public.courier_providers (name, code, is_active, is_default, configuration)
VALUES
    ('Custom In-House Logistics', 'CUSTOM', TRUE, TRUE, '{"mode": "manual", "auto_track": false}'::JSONB),
    ('Steadfast Courier', 'STEADFAST', TRUE, FALSE, '{"api_base_url": "https://portal.steadfast.com.bd/api/v1"}'::JSONB),
    ('Pathao Logistics', 'PATHAO', TRUE, FALSE, '{"api_base_url": "https://api-hermes.pathao.com"}'::JSONB),
    ('RedX Express', 'REDX', TRUE, FALSE, '{"api_base_url": "https://openapi.redx.com.bd/v1.0.0-beta"}'::JSONB)
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. FULFILLMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fulfillments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_provider_id UUID REFERENCES public.courier_providers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED' CHECK (status IN (
        'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'CANCELLED', 'RETURNED'
    )),
    tracking_number VARCHAR(100),
    shipping_label_url TEXT,
    shipment_reference VARCHAR(100),
    pickup_reference VARCHAR(100),
    courier_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fulfillments_order ON public.fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_tracking ON public.fulfillments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_fulfillments_status ON public.fulfillments(status);
CREATE INDEX IF NOT EXISTS idx_fulfillments_courier ON public.fulfillments(courier_provider_id);

-- ------------------------------------------------------------------------------
-- 3. RETURN REQUESTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.return_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'RECEIVED', 'COMPLETED'
    )),
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    admin_notes TEXT,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);

-- ------------------------------------------------------------------------------
-- 4. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- NULL for broadcast admin alerts
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN (
        'IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'
    )),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Public can view active courier provider names
CREATE POLICY "Public can view active courier providers" ON public.courier_providers
    FOR SELECT USING (is_active = TRUE);

-- Service Role Full Access
CREATE POLICY "Service Role full access on courier_providers" ON public.courier_providers
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on fulfillments" ON public.fulfillments
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on return_requests" ON public.return_requests
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on notifications" ON public.notifications
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
