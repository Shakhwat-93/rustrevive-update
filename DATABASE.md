# Rust & Revive — Database Architecture & Schema Specification
**Version:** 1.0.0-PROD  
**Database Engine:** PostgreSQL 15+ (Self-Hosted via Supabase)  
**Schema Standard:** 3NF Normalized, UUID Primary Keys, Timestamped, Soft-Delete Aware, Audit-Logged  

---

## 1. Schema Design Principles

1. **Strict Data Integrity:**
   - Primary Keys: Standardized `UUID` (or `gen_random_uuid()` / `uuidv7`) across all core entities to prevent enumeration attacks and simplify distributed operations.
   - Foreign Keys: Explicit `REFERENCES` with defined `ON DELETE RESTRICT` or `ON DELETE CASCADE` semantics.
   - Financial Precision: All monetary amounts are stored as `NUMERIC(12, 2)` or `INTEGER` representing cents (to prevent floating-point inaccuracies). We standardize on `INTEGER` (cents in base currency, e.g., 4500 = $45.00) with auxiliary `NUMERIC(12, 2)` views where needed.
2. **Auditability & Temporal Tracking:**
   - Every transactional table contains `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
   - Critical domain entities support soft deletion via `deleted_at TIMESTAMPTZ NULL` and active record indexes.
   - Financial and inventory changes use **immutable append-only ledgers** (`inventory_movements`, `audit_logs`).
3. **Optimized Indexing:**
   - B-Tree indexes on all foreign keys, status columns, slugs, and composite lookup columns (`[deleted_at, is_published, category_id]`).
   - GIN indexes on JSONB fields and Full-Text Search vectors for product title, description, and tags.

---

## 2. Entity Relationship Overview (Logical ERD)

```
[auth.users] (Supabase Auth)
     | 1:1
[public.users] ──< 1:N >── [user_roles] ──< N:1 >── [roles] ──< N:M >── [permissions]
     |
     +──< 1:N >── [customers] ──< 1:N >── [addresses]
     |                 |
     |                 +──< 1:N >── [orders] ──< 1:N >── [order_items] ──< N:1 >── [product_variants]
     |                 |               |                                                |
     |                 |               +──< 1:N >── [payments]                          |
     |                 |               +──< 1:N >── [shipments]                         |
     |                 |                                                                |
     |                 +──< 1:1 >── [carts] ──< 1:N >── [cart_items]                    |
     |                                                                                  |
     +──< 1:N >── [reviews] ──> [products] ──< 1:N >── [product_variants] <────────────+
                                    |                       |
                                    +──< 1:N >── [product_images] ──< N:1 >── [media]
                                    |                       |
     [categories] <──< M:N >────────+                       +──< 1:1 >── [inventory] ──< 1:N >── [inventory_movements]
```

---

## 3. Comprehensive Table Definitions

### 3.1 Authentication & Authorization (RBAC)

#### `roles`
Defines available system roles (e.g., `super_admin`, `store_manager`, `content_editor`, `customer`).
- `id` (UUID, PK, `gen_random_uuid()`)
- `name` (VARCHAR(50), UNIQUE, NOT NULL) — e.g., 'admin', 'customer', 'manager'
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `permissions`
Granular access capabilities.
- `id` (UUID, PK, `gen_random_uuid()`)
- `action` (VARCHAR(100), UNIQUE, NOT NULL) — e.g., 'products:write', 'orders:cancel', 'media:delete'
- `module` (VARCHAR(50), NOT NULL) — e.g., 'catalog', 'sales', 'settings'
- `description` (TEXT)

#### `role_permissions`
Join table mapping roles to granular permissions.
- `role_id` (UUID, REFERENCES roles(id) ON DELETE CASCADE, PK)
- `permission_id` (UUID, REFERENCES permissions(id) ON DELETE CASCADE, PK)

#### `users` (Public Profile Mirror)
Extends Supabase `auth.users` with application metadata.
- `id` (UUID, PK, REFERENCES auth.users(id) ON DELETE CASCADE)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `full_name` (VARCHAR(255))
- `phone` (VARCHAR(50))
- `avatar_url` (TEXT)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `user_roles`
Assigns roles to users.
- `user_id` (UUID, REFERENCES users(id) ON DELETE CASCADE, PK)
- `role_id` (UUID, REFERENCES roles(id) ON DELETE CASCADE, PK)
- `assigned_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `assigned_by` (UUID, REFERENCES users(id))

---

### 3.2 Catalog Architecture

#### `categories`
Hierarchical category structure (e.g., Men > Jackets, Vintage > Belts).
- `id` (UUID, PK, `gen_random_uuid()`)
- `parent_id` (UUID, REFERENCES categories(id) ON DELETE SET NULL)
- `name` (VARCHAR(100), NOT NULL)
- `slug` (VARCHAR(120), UNIQUE, NOT NULL)
- `description` (TEXT)
- `image_url` (TEXT)
- `display_order` (INT, NOT NULL, DEFAULT 0)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `seo_title` (VARCHAR(255))
- `seo_description` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ NULL)
- *Indexes:* `idx_categories_slug` (UNIQUE), `idx_categories_parent_id`, `idx_categories_active_order`

#### `products`
The core conceptual product container.
- `id` (UUID, PK, `gen_random_uuid()`)
- `title` (VARCHAR(255), NOT NULL)
- `slug` (VARCHAR(280), UNIQUE, NOT NULL)
- `subtitle` (VARCHAR(255))
- `description` (TEXT, NOT NULL) — Editorial narrative & specifications
- `materials_care` (TEXT)
- `status` (VARCHAR(30), NOT NULL, DEFAULT 'draft') — 'draft', 'published', 'archived'
- `is_featured` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `base_price_cents` (INTEGER, NOT NULL) — Base reference price in cents
- `compare_at_price_cents` (INTEGER NULL) — Original MSRP for strikethrough sale display
- `cost_price_cents` (INTEGER NULL) — Internal cost for margin analysis
- `meta_title` (VARCHAR(255))
- `meta_description` (TEXT)
- `attributes` (JSONB, DEFAULT '{}'::jsonb) — Flexible taxonomy (e.g., `{"vintage_era": "90s", "origin": "Japan"}`)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ NULL)
- *Indexes:* `idx_products_slug` (UNIQUE), `idx_products_status_featured`, `idx_products_created_at` DESC, GIN `idx_products_search` on `to_tsvector('english', title || ' ' || description)`

#### `product_categories`
Many-to-Many junction between products and categories.
- `product_id` (UUID, REFERENCES products(id) ON DELETE CASCADE)
- `category_id` (UUID, REFERENCES categories(id) ON DELETE CASCADE)
- `is_primary` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `PRIMARY KEY (product_id, category_id)`

#### `product_variants`
The sellable SKU units (Size, Color combinations).
- `id` (UUID, PK, `gen_random_uuid()`)
- `product_id` (UUID, REFERENCES products(id) ON DELETE CASCADE, NOT NULL)
- `sku` (VARCHAR(100), UNIQUE, NOT NULL)
- `title` (VARCHAR(150), NOT NULL) — e.g., 'Washed Indigo / 32'
- `option1_name` (VARCHAR(50)) — e.g., 'Color'
- `option1_value` (VARCHAR(50)) — e.g., 'Washed Indigo'
- `option2_name` (VARCHAR(50)) — e.g., 'Size'
- `option2_value` (VARCHAR(50)) — e.g., '32'
- `price_cents` (INTEGER, NOT NULL) — Variant override price in cents
- `compare_at_price_cents` (INTEGER NULL)
- `weight_grams` (INTEGER, DEFAULT 0)
- `barcode` (VARCHAR(100))
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `position` (INT, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `deleted_at` (TIMESTAMPTZ NULL)
- *Indexes:* `idx_variants_product_id`, `idx_variants_sku` (UNIQUE)

---

### 3.3 Media & Asset Registry

#### `media`
Decoupled central registry for all Cloudflare R2 binary assets.
- `id` (UUID, PK, `gen_random_uuid()`)
- `storage_key` (VARCHAR(500), UNIQUE, NOT NULL) — R2 Object Key path, e.g. `products/2026/08/jacket-01-abc123_1600.webp`
- `bucket_name` (VARCHAR(100), NOT NULL)
- `public_url` (VARCHAR(1000), NOT NULL) — `https://media.rustrevive.store/products/...`
- `filename` (VARCHAR(255), NOT NULL)
- `file_size_bytes` (BIGINT, NOT NULL)
- `mime_type` (VARCHAR(100), NOT NULL)
- `width` (INT)
- `height` (INT)
- `blur_hash` (TEXT) — Low-res placeholder string for fast rendering
- `alt_text` (VARCHAR(255))
- `uploaded_by` (UUID, REFERENCES users(id) ON DELETE SET NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Indexes:* `idx_media_storage_key` (UNIQUE), `idx_media_created_at` DESC

#### `product_images`
Associates media items to products and specific variants.
- `id` (UUID, PK, `gen_random_uuid()`)
- `product_id` (UUID, REFERENCES products(id) ON DELETE CASCADE, NOT NULL)
- `variant_id` (UUID, REFERENCES product_variants(id) ON DELETE SET NULL)
- `media_id` (UUID, REFERENCES media(id) ON DELETE RESTRICT, NOT NULL)
- `display_order` (INT, NOT NULL, DEFAULT 0)
- `is_primary` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Indexes:* `idx_product_images_product_order`, `idx_product_images_variant`

---

### 3.4 Inventory & Stock Ledger

#### `inventory`
Real-time snapshot of stock for each variant.
- `id` (UUID, PK, `gen_random_uuid()`)
- `variant_id` (UUID, UNIQUE, REFERENCES product_variants(id) ON DELETE CASCADE, NOT NULL)
- `quantity_available` (INTEGER, NOT NULL, DEFAULT 0)
- `quantity_reserved` (INTEGER, NOT NULL, DEFAULT 0) — Reserved during active checkouts
- `low_stock_threshold` (INTEGER, NOT NULL, DEFAULT 5)
- `allow_backorder` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Constraint:* `CHECK (quantity_available >= 0)` (when backorders not allowed)

#### `inventory_movements`
Immutable append-only ledger of every stock modification.
- `id` (UUID, PK, `gen_random_uuid()`)
- `variant_id` (UUID, REFERENCES product_variants(id) ON DELETE CASCADE, NOT NULL)
- `quantity_change` (INTEGER, NOT NULL) — Positive (restock, return) or Negative (order fulfilled, damage)
- `movement_type` (VARCHAR(50), NOT NULL) — 'purchase', 'order_fulfillment', 'restock', 'manual_adjustment', 'return'
- `reference_id` (VARCHAR(100)) — Order ID or PO reference
- `notes` (TEXT)
- `created_by` (UUID, REFERENCES users(id))
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Indexes:* `idx_inv_movements_variant_time`

---

### 3.5 Customers & Addresses

#### `customers`
Customer entity linked optionally to `users` (supports guest checkouts).
- `id` (UUID, PK, `gen_random_uuid()`)
- `user_id` (UUID, UNIQUE, REFERENCES users(id) ON DELETE SET NULL)
- `email` (VARCHAR(255), NOT NULL)
- `first_name` (VARCHAR(100))
- `last_name` (VARCHAR(100))
- `phone` (VARCHAR(50))
- `total_orders_count` (INT, NOT NULL, DEFAULT 0)
- `total_spent_cents` (BIGINT, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Indexes:* `idx_customers_email` (UNIQUE when user_id IS NULL logic handled at app layer), `idx_customers_user_id`

#### `addresses`
Shipping and billing address book.
- `id` (UUID, PK, `gen_random_uuid()`)
- `customer_id` (UUID, REFERENCES customers(id) ON DELETE CASCADE, NOT NULL)
- `address_type` (VARCHAR(20), NOT NULL, DEFAULT 'shipping') — 'shipping', 'billing', 'both'
- `first_name` (VARCHAR(100), NOT NULL)
- `last_name` (VARCHAR(100), NOT NULL)
- `company` (VARCHAR(150))
- `address_line1` (VARCHAR(255), NOT NULL)
- `address_line2` (VARCHAR(255))
- `city` (VARCHAR(100), NOT NULL)
- `state_province` (VARCHAR(100), NOT NULL)
- `postal_code` (VARCHAR(20), NOT NULL)
- `country_code` (VARCHAR(2), NOT NULL) — ISO 3166-1 alpha-2 (e.g. 'US', 'GB')
- `phone` (VARCHAR(50))
- `is_default` (BOOLEAN, NOT NULL, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

---

### 3.6 Carts, Orders & Checkout

#### `carts`
Persistent server-side carts for guests (via cookie session token) and authenticated users.
- `id` (UUID, PK, `gen_random_uuid()`)
- `customer_id` (UUID, REFERENCES customers(id) ON DELETE SET NULL)
- `session_token` (VARCHAR(255), UNIQUE, NOT NULL) — Secure UUID in httpOnly cookie
- `currency_code` (VARCHAR(3), NOT NULL, DEFAULT 'USD')
- `coupon_id` (UUID, REFERENCES coupons(id) ON DELETE SET NULL)
- `expires_at` (TIMESTAMPTZ, NOT NULL)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `cart_items`
Individual line items in an active cart.
- `id` (UUID, PK, `gen_random_uuid()`)
- `cart_id` (UUID, REFERENCES carts(id) ON DELETE CASCADE, NOT NULL)
- `variant_id` (UUID, REFERENCES product_variants(id) ON DELETE CASCADE, NOT NULL)
- `quantity` (INTEGER, NOT NULL, DEFAULT 1)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Constraint:* `UNIQUE(cart_id, variant_id)`
- *Constraint:* `CHECK (quantity > 0)`

#### `orders`
Immutable record of finalized customer transactions.
- `id` (UUID, PK, `gen_random_uuid()`)
- `order_number` (VARCHAR(50), UNIQUE, NOT NULL) — Human readable format, e.g. `RR-2026-10492`
- `customer_id` (UUID, REFERENCES customers(id) ON DELETE RESTRICT, NOT NULL)
- `email` (VARCHAR(255), NOT NULL)
- `status` (VARCHAR(30), NOT NULL, DEFAULT 'pending') — 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
- `currency_code` (VARCHAR(3), NOT NULL, DEFAULT 'USD')
- `subtotal_cents` (INTEGER, NOT NULL)
- `discount_cents` (INTEGER, NOT NULL, DEFAULT 0)
- `shipping_fee_cents` (INTEGER, NOT NULL, DEFAULT 0)
- `tax_cents` (INTEGER, NOT NULL, DEFAULT 0)
- `total_cents` (INTEGER, NOT NULL)
- `coupon_code` (VARCHAR(50))
- `shipping_address` (JSONB, NOT NULL) — Snapshot of shipping address at checkout
- `billing_address` (JSONB, NOT NULL) — Snapshot of billing address at checkout
- `notes` (TEXT)
- `cancelled_at` (TIMESTAMPTZ NULL)
- `cancel_reason` (TEXT)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Indexes:* `idx_orders_order_number` (UNIQUE), `idx_orders_customer_id`, `idx_orders_status`, `idx_orders_created_at` DESC

#### `order_items`
Snapshot of products purchased within an order.
- `id` (UUID, PK, `gen_random_uuid()`)
- `order_id` (UUID, REFERENCES orders(id) ON DELETE CASCADE, NOT NULL)
- `variant_id` (UUID, REFERENCES product_variants(id) ON DELETE RESTRICT, NOT NULL)
- `product_title` (VARCHAR(255), NOT NULL) — Preserved title
- `variant_title` (VARCHAR(150), NOT NULL) — Preserved variant option string
- `sku` (VARCHAR(100), NOT NULL)
- `price_cents` (INTEGER, NOT NULL) — Unit price captured at purchase
- `quantity` (INTEGER, NOT NULL)
- `total_cents` (INTEGER, NOT NULL)
- `image_url` (TEXT) — Preserved thumbnail URL
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `payments`
Tracks payment transactions and gateway state.
- `id` (UUID, PK, `gen_random_uuid()`)
- `order_id` (UUID, REFERENCES orders(id) ON DELETE CASCADE, NOT NULL)
- `payment_gateway` (VARCHAR(50), NOT NULL) — e.g. 'stripe', 'paypal', 'manual'
- `gateway_transaction_id` (VARCHAR(255), UNIQUE)
- `amount_cents` (INTEGER, NOT NULL)
- `currency_code` (VARCHAR(3), NOT NULL, DEFAULT 'USD')
- `status` (VARCHAR(30), NOT NULL) — 'requires_payment_method', 'requires_confirmation', 'processing', 'succeeded', 'failed', 'refunded'
- `gateway_response` (JSONB) — Raw webhook/gateway payload for reconciliation
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `shipments`
Tracks fulfillment and tracking numbers.
- `id` (UUID, PK, `gen_random_uuid()`)
- `order_id` (UUID, REFERENCES orders(id) ON DELETE CASCADE, NOT NULL)
- `carrier` (VARCHAR(100), NOT NULL) — e.g., 'DHL', 'FedEx', 'UPS', 'USPS'
- `tracking_number` (VARCHAR(200))
- `tracking_url` (TEXT)
- `status` (VARCHAR(50), NOT NULL, DEFAULT 'label_created') — 'label_created', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
- `shipped_at` (TIMESTAMPTZ)
- `delivered_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

---

### 3.7 Marketing, Reviews, Content & CMS

#### `coupons`
Promotional discount engine.
- `id` (UUID, PK, `gen_random_uuid()`)
- `code` (VARCHAR(50), UNIQUE, NOT NULL) — e.g., 'RUSTVINTAGE20'
- `discount_type` (VARCHAR(20), NOT NULL) — 'percentage', 'fixed_amount', 'free_shipping'
- `discount_value` (INTEGER, NOT NULL) — Percentage (e.g. 20 for 20%) or Fixed Cents (e.g. 2000 for $20.00)
- `min_order_cents` (INTEGER, DEFAULT 0)
- `max_discount_cents` (INTEGER)
- `starts_at` (TIMESTAMPTZ, NOT NULL)
- `expires_at` (TIMESTAMPTZ)
- `usage_limit` (INTEGER) — Global max redemptions
- `usage_count` (INTEGER, NOT NULL, DEFAULT 0)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `coupon_redemptions`
Audit log of which customer redeemed which coupon on which order.
- `id` (UUID, PK, `gen_random_uuid()`)
- `coupon_id` (UUID, REFERENCES coupons(id) ON DELETE RESTRICT, NOT NULL)
- `customer_id` (UUID, REFERENCES customers(id) ON DELETE CASCADE, NOT NULL)
- `order_id` (UUID, REFERENCES orders(id) ON DELETE CASCADE, NOT NULL)
- `redeemed_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `reviews`
Verified buyer customer reviews.
- `id` (UUID, PK, `gen_random_uuid()`)
- `product_id` (UUID, REFERENCES products(id) ON DELETE CASCADE, NOT NULL)
- `customer_id` (UUID, REFERENCES customers(id) ON DELETE CASCADE, NOT NULL)
- `order_item_id` (UUID, REFERENCES order_items(id) ON DELETE SET NULL)
- `rating` (SMALLINT, NOT NULL) — 1 to 5
- `title` (VARCHAR(200))
- `comment` (TEXT, NOT NULL)
- `is_verified_purchase` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `is_approved` (BOOLEAN, NOT NULL, DEFAULT FALSE) — Moderation gate
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())
- *Constraint:* `CHECK (rating >= 1 AND rating <= 5)`

#### `homepage_sections` & `banners`
Dynamic visual merchandising for the editorial storefront.
- `id` (UUID, PK, `gen_random_uuid()`)
- `section_key` (VARCHAR(100), UNIQUE, NOT NULL) — e.g. 'hero_editorial', 'featured_collection', 'brand_story'
- `title` (VARCHAR(255))
- `subtitle` (TEXT)
- `content_payload` (JSONB, NOT NULL, DEFAULT '{}'::jsonb) — Curated product IDs, lookbook links, typography config
- `media_id` (UUID, REFERENCES media(id) ON DELETE SET NULL)
- `display_order` (INTEGER, NOT NULL, DEFAULT 0)
- `is_active` (BOOLEAN, NOT NULL, DEFAULT TRUE)
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW())

#### `audit_logs` & `system_settings`
Security tracking and global store parameters.
- `audit_logs`: `(id, user_id, action, entity_type, entity_id, old_values JSONB, new_values JSONB, ip_address, user_agent, created_at)`
- `system_settings`: `(key VARCHAR(100) PK, value JSONB NOT NULL, description TEXT, updated_at TIMESTAMPTZ)`

---

## 4. Transaction Boundaries & Concurrency Guarantees

```
Order Placement Transaction Flow:
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
  1. Validate active Cart and locked CartItems.
  2. Lock required Variant inventory rows (SELECT FOR UPDATE).
  3. Verify stock: (quantity_available - quantity_reserved >= requested_quantity).
  4. Decrement quantity_available and create inventory_movements records.
  5. Apply Coupon validation & increment usage_count.
  6. INSERT INTO orders & order_items.
  7. INSERT INTO payments (status: pending).
  8. DELETE / Invalidate Cart.
COMMIT;
```
