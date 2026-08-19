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
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`SQL Execution failed (${res.status}): ${text}`);
  }
  return text;
}

async function run() {
  console.log("==================================================");
  console.log("RUST & REVIVE — PHASE 12 MIGRATION RUNNER");
  console.log("Profiles + Auth Trigger + Customer RLS");
  console.log("==================================================");

  const sql = fs.readFileSync(
    "supabase/migrations/20260819_006_phase12_customer_auth_profiles_rls.sql",
    "utf8"
  );

  // Split on double newlines but execute as one block to preserve transactions
  try {
    console.log("Applying Phase 12 migration...");
    await executeSql(sql);
    console.log("✅ Phase 12 migration applied successfully.");
    console.log("");
    console.log("What was applied:");
    console.log("  ✅ profiles table created (id = auth.users.id)");
    console.log("  ✅ handle_new_user() trigger function created");
    console.log("  ✅ on_auth_user_created trigger activated on auth.users");
    console.log("  ✅ profiles_updated_at trigger set");
    console.log("  ✅ RLS enabled on profiles (customer reads own only)");
    console.log("  ✅ Customer RLS on customers, customer_addresses, orders, order_items");
    console.log("  ✅ Customer RLS on wishlist_items, product_reviews");
    console.log("  ✅ PostgREST schema cache reloaded");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    // Try step by step
    process.exit(1);
  }
}

run();
