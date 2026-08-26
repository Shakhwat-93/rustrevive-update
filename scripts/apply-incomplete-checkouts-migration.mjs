import fs from "node:fs";

// Read environment
const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSql(sql) {
  const res = await fetch(`${url}/pg/query`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SQL Execution failed (${res.status}): ${errText}`);
  }
  return res.json();
}

async function run() {
  console.log("Creating incomplete_checkouts table and indexes...");
  const sql = `
    CREATE TABLE IF NOT EXISTS incomplete_checkouts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      checkout_session_id TEXT UNIQUE NOT NULL,
      cart_session_id TEXT NOT NULL,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      shipping_address TEXT,
      city TEXT,
      area TEXT,
      postal_code TEXT,
      cart_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
      item_count INT NOT NULL DEFAULT 0,
      subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
      discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      shipping_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      estimated_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
      shipping_method_id TEXT,
      coupon_code TEXT,
      customer_notes TEXT,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
      last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_status ON incomplete_checkouts(status);
    CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_last_activity ON incomplete_checkouts(last_activity_at DESC);
    CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_customer ON incomplete_checkouts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_session ON incomplete_checkouts(checkout_session_id);
    CREATE INDEX IF NOT EXISTS idx_incomplete_checkouts_cart_session ON incomplete_checkouts(cart_session_id);

    NOTIFY pgrst, 'reload schema';
  `;

  const result = await executeSql(sql);
  console.log("Migration executed successfully:", result);
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
