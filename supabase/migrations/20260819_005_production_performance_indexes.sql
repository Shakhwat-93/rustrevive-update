-- ==============================================================================
-- RUST & REVIVE — PHASE 9: PRODUCTION PERFORMANCE & COMPOSITE INDEXES
-- Purpose: Accelerate high-frequency queries and optimize PostgREST performance
-- ==============================================================================

-- 1. Products & Variants Composite Indexes
CREATE INDEX IF NOT EXISTS idx_products_catalog_query 
ON public.products(status, is_active, category_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_product_variants_lookup 
ON public.product_variants(product_id, sku, is_active);

-- 2. Orders & Items Query Indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_timeline 
ON public.orders(customer_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_admin_search 
ON public.orders(order_number, payment_status, fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_product_lookup 
ON public.order_items(order_id, product_id);

-- 3. Inventory Fast Ledger Index
CREATE INDEX IF NOT EXISTS idx_inventory_product_variant 
ON public.inventory(product_id, variant_id);

-- 4. Fulfillments & Tracking Query
CREATE INDEX IF NOT EXISTS idx_fulfillments_tracking_search 
ON public.fulfillments(order_id, tracking_number);

-- 5. Reviews & Ratings Index
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating 
ON public.product_reviews(product_id, status, rating);

-- 6. Analytics Fast Event Filtering
CREATE INDEX IF NOT EXISTS idx_analytics_type_date 
ON public.analytics_events(event_type, created_at DESC);
