-- ==============================================================================
-- RUST & REVIVE — PHASE 8: PAYMENTS, DISCOUNTS, REVIEWS, WISHLIST & MARKETING
-- Schema: 3NF Normalized, Enterprise Financial Ledger, Analytics Event Store
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PAYMENT TRANSACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'COD', 'SSL_COMMERZ', 'BKASH', 'NAGAD', 'STRIPE'
    provider_transaction_id VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED' CHECK (status IN (
        'INITIATED', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'
    )),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    gateway_response_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_tx_provider_tx ON public.payment_transactions(provider_transaction_id);

-- ------------------------------------------------------------------------------
-- 2. REFUNDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_transaction_id UUID NOT NULL REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    provider_refund_id VARCHAR(100),
    created_by VARCHAR(100) NOT NULL DEFAULT 'Admin Staff',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);

-- ------------------------------------------------------------------------------
-- 3. DISCOUNTS / COUPONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING')),
    value NUMERIC(10,2) NOT NULL,
    minimum_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    maximum_discount_amount NUMERIC(10,2),
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_customer_limit INT NOT NULL DEFAULT 1,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Launch Coupons
INSERT INTO public.discounts (code, name, type, value, minimum_order_amount, maximum_discount_amount, usage_limit, is_active)
VALUES
    ('REVIVE10', 'Launch Celebration 10% Off', 'PERCENTAGE', 10.00, 1000.00, 500.00, 500, TRUE),
    ('HERITAGE500', 'Flat ৳500 Off Premium Apparel', 'FIXED_AMOUNT', 500.00, 4000.00, 500.00, 200, TRUE),
    ('FREESHIP', 'Complimentary Nationwide Shipping', 'FREE_SHIPPING', 120.00, 2500.00, 120.00, 1000, TRUE)
ON CONFLICT (code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts(is_active);

-- ------------------------------------------------------------------------------
-- 4. DISCOUNT USAGES TABLE (Audit Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discount_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID NOT NULL REFERENCES public.discounts(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    discount_amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_usages_discount ON public.discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_customer ON public.discount_usages(customer_id);

-- ------------------------------------------------------------------------------
-- 5. WISHLIST ITEMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_product_wishlist UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_customer ON public.wishlist_items(customer_id);

-- ------------------------------------------------------------------------------
-- 6. PRODUCT REVIEWS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'
    )),
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.product_reviews(status);

-- ------------------------------------------------------------------------------
-- 7. CUSTOMER SEGMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rules JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.customer_segments (name, slug, description, rules)
VALUES
    ('High-Value Patrons', 'high-value', 'Customers with cumulative spend exceeding ৳10,000', '{"min_spend": 10000}'::JSONB),
    ('Recent Buyers', 'recent-buyers', 'Customers who placed an order in the last 30 days', '{"days_since_last_order": 30}'::JSONB),
    ('New Customers', 'new-customers', 'Customers with exactly 1 completed order', '{"order_count": 1}'::JSONB)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. MARKETING CAMPAIGNS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'PROMOTION' CHECK (type IN (
        'PROMOTION', 'PRODUCT_CAMPAIGN', 'COLLECTION_CAMPAIGN', 'EMAIL', 'WHATSAPP', 'SMS'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    )),
    target_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
    target_id VARCHAR(100),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.marketing_campaigns(status);

-- ------------------------------------------------------------------------------
-- 9. ANALYTICS EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'BEGIN_CHECKOUT', 'PURCHASE', 'WISHLIST_ADD', 'SEARCH'
    )),
    session_id VARCHAR(100),
    user_id UUID,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_resource ON public.analytics_events(resource_type, resource_id);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public can view active discounts & approved product reviews
CREATE POLICY "Public can view active discounts" ON public.discounts
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view approved reviews" ON public.product_reviews
    FOR SELECT USING (status = 'APPROVED');

-- Service Role Full Access
CREATE POLICY "Service Role full access on payment_transactions" ON public.payment_transactions
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on refunds" ON public.refunds
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on discounts" ON public.discounts
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on discount_usages" ON public.discount_usages
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on wishlist_items" ON public.wishlist_items
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on product_reviews" ON public.product_reviews
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on customer_segments" ON public.customer_segments
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on marketing_campaigns" ON public.marketing_campaigns
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on analytics_events" ON public.analytics_events
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
