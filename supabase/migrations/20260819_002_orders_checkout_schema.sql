-- ==============================================================================
-- RUST & REVIVE — ORDERS, CHECKOUT, CUSTOMERS & STOCK RESERVATIONS (Phase 6)
-- Schema: 3NF Normalized, Idempotency-Safe, Sequential Human Order Numbers
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ORDER NUMBER SEQUENCE & GENERATOR
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 100001;

CREATE OR REPLACE FUNCTION generate_order_number() 
RETURNS TEXT AS $$
BEGIN
    RETURN 'RR-' || nextval('public.order_number_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. CUSTOMERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- References auth.users if registered
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_auth ON public.customers(auth_user_id);

-- ------------------------------------------------------------------------------
-- 3. CUSTOMER ADDRESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    postal_code VARCHAR(30),
    country VARCHAR(100) NOT NULL DEFAULT 'Bangladesh',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_cust ON public.customer_addresses(customer_id);

-- ------------------------------------------------------------------------------
-- 4. SHIPPING METHODS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0, -- In base currency BDT (৳)
    estimated_days VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default luxury shipping methods if empty
INSERT INTO public.shipping_methods (name, description, price, estimated_days, sort_order)
VALUES 
    ('Standard Nationwide Delivery', 'Delivered within 3–5 business days across Bangladesh via secure courier.', 120, '3-5 business days', 1),
    ('Dhaka Express Priority', 'Next-day priority delivery within Dhaka Metropolitan area.', 80, '1-2 business days', 2)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE DEFAULT generate_order_number(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'
    )),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'COD_PENDING' CHECK (payment_status IN (
        'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'COD_PENDING', 'COD_COLLECTED'
    )),
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'UNFULFILLED' CHECK (fulfillment_status IN (
        'UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED', 'CANCELLED'
    )),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
    subtotal INTEGER NOT NULL,
    discount_total INTEGER NOT NULL DEFAULT 0,
    shipping_total INTEGER NOT NULL DEFAULT 0,
    tax_total INTEGER NOT NULL DEFAULT 0,
    grand_total INTEGER NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    shipping_address_snapshot JSONB NOT NULL,
    billing_address_snapshot JSONB,
    notes TEXT, -- Internal Staff Notes
    customer_notes TEXT, -- Customer Delivery Notes
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);

-- ------------------------------------------------------------------------------
-- 6. ORDER ITEMS TABLE (Immutable Historic Snapshots)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title_snapshot VARCHAR(255) NOT NULL,
    variant_title_snapshot VARCHAR(150),
    sku_snapshot VARCHAR(100) NOT NULL,
    image_url_snapshot TEXT,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_prod ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_var ON public.order_items(variant_id);

-- ------------------------------------------------------------------------------
-- 7. ORDER EVENTS TABLE (Audit Timeline)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'ORDER_PLACED', 'STATUS_CHANGED', 'PAYMENT_UPDATED', 'NOTE_ADDED'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    message TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL DEFAULT 'System',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created ON public.order_events(created_at ASC);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Public READ Policies
CREATE POLICY "Public can view active shipping methods" ON public.shipping_methods
    FOR SELECT USING (is_active = TRUE);

-- Privileged Staff Policies (Service Role / Staff)
CREATE POLICY "Service Role full access on customers" ON public.customers
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on customer_addresses" ON public.customer_addresses
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on shipping_methods" ON public.shipping_methods
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on orders" ON public.orders
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on order_items" ON public.order_items
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Service Role full access on order_events" ON public.order_events
    FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
