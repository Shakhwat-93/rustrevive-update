-- ==============================================================================
-- RUST & REVIVE — PHASE 12: CUSTOMER AUTH + PROFILES + RLS
-- Customer Auth, Profiles, Customer RLS, DB Triggers
-- SAFE MIGRATION: Only creates new objects, does not alter/drop existing ones
-- ==============================================================================

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
-- profiles.id = auth.users.id  (same UUID, 1:1 relationship)
-- This avoids a join on auth_user_id and is the Supabase canonical pattern.
-- The existing customers table remains for order management / guest snapshots.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(150),
    phone VARCHAR(50),
    avatar_url TEXT,
    email VARCHAR(255), -- Mirrored from auth.users for faster reads
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 2. LINK auth_user_id ON customers TABLE TO profiles
-- When a customer registers, a profile is created first.
-- The customers record is linked for order attribution (optional).
-- ==============================================================================
-- Index already exists: idx_customers_auth ON public.customers(auth_user_id)

-- ==============================================================================
-- 3. PROFILE AUTO-CREATE TRIGGER
-- When a new user registers via Supabase Auth, automatically create a profile.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
            ''
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. PROFILES UPDATED_AT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY — PROFILES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Customers can read their own profile only
CREATE POLICY "Customer can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Customers can update their own profile only
CREATE POLICY "Customer can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service Role full access
CREATE POLICY "Service Role full access on profiles"
    ON public.profiles FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY — CUSTOMERS TABLE (customer-scoped)
-- ==============================================================================
DROP POLICY IF EXISTS "Service Role full access on customers" ON public.customers;
CREATE POLICY "Service Role full access on customers"
    ON public.customers FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Customer can read own customer record" ON public.customers;
CREATE POLICY "Customer can read own customer record"
    ON public.customers FOR SELECT
    USING (auth_user_id = auth.uid());

-- ==============================================================================
-- 7. ROW LEVEL SECURITY — CUSTOMER ADDRESSES
-- ==============================================================================
DROP POLICY IF EXISTS "Service Role full access on customer_addresses" ON public.customer_addresses;
CREATE POLICY "Service Role full access on customer_addresses"
    ON public.customer_addresses FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Customer can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Customer can manage own addresses"
    ON public.customer_addresses FOR ALL
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 8. ROW LEVEL SECURITY — ORDERS
-- ==============================================================================
DROP POLICY IF EXISTS "Customer can read own orders" ON public.orders;
CREATE POLICY "Customer can read own orders"
    ON public.orders FOR SELECT
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customer can read own order items" ON public.order_items;
CREATE POLICY "Customer can read own order items"
    ON public.order_items FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM public.orders
            WHERE customer_id IN (
                SELECT id FROM public.customers
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- ==============================================================================
-- 9. ROW LEVEL SECURITY — WISHLIST
-- ==============================================================================
DROP POLICY IF EXISTS "Customer can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Customer can manage own wishlist"
    ON public.wishlist_items FOR ALL
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 10. ROW LEVEL SECURITY — REVIEWS
-- ==============================================================================
DROP POLICY IF EXISTS "Customer can insert own review" ON public.product_reviews;
CREATE POLICY "Customer can insert own review"
    ON public.product_reviews FOR INSERT
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Customer can update own review" ON public.product_reviews;
CREATE POLICY "Customer can update own review"
    ON public.product_reviews FOR UPDATE
    USING (
        customer_id IN (
            SELECT id FROM public.customers
            WHERE auth_user_id = auth.uid()
        )
    );

-- ==============================================================================
-- Notify PostgREST to reload schema
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
