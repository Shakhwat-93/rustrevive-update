import fs from "node:fs";
import path from "node:path";

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

async function runMigrations() {
  console.log("==================================================");
  console.log("RUST & REVIVE — DATABASE MIGRATION RUNNER");
  console.log("==================================================");

  const migrationFile = "supabase/migrations/20260819_001_commerce_core_schema.sql";
  console.log(`Applying migration: ${migrationFile}...`);
  const sql = fs.readFileSync(migrationFile, "utf8");

  try {
    await executeSql(sql);
    console.log("✅ Migration applied successfully!");

    // Reload PostgREST schema cache so PostgREST recognizes newly created tables immediately
    console.log("Notifying PostgREST to reload schema cache...");
    await executeSql("NOTIFY pgrst, 'reload schema';");
    console.log("✅ PostgREST schema cache reloaded!");

    // Verify created tables
    const tables = await executeSql(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log("Public Tables in Supabase PostgreSQL:");
    console.log(tables.map((t) => `  - ${t.table_name}`).join("\n"));
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

runMigrations();
