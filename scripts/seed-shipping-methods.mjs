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
  console.log("==================================================");
  console.log("RUST & REVIVE — SHIPPING METHODS SEED & SYNC");
  console.log("==================================================");

  const sql = `
    DELETE FROM public.shipping_methods;
    
    INSERT INTO public.shipping_methods (name, description, price, estimated_days, is_active, sort_order)
    VALUES
      ('Inside Dhaka', NULL, 80, '24-48 hours', true, 1),
      ('Sub-Dhaka', 'Keraniganj, Gazipur, Narayanganj, Savar', 100, '48 hours', true, 2),
      ('Outside Dhaka', NULL, 150, '48-72 hours', true, 3);
  `;

  try {
    await executeSql(sql);
    console.log("✅ Successfully seeded 3 default shipping methods:");
    console.log("   1. Inside Dhaka — ৳80.00");
    console.log("   2. Sub-Dhaka (Keraniganj, Gazipur, Narayanganj, Savar) — ৳100.00");
    console.log("   3. Outside Dhaka — ৳150.00");
  } catch (err) {
    console.error("❌ Error updating shipping methods:", err.message);
    process.exit(1);
  }
}

run();
