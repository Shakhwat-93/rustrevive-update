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

async function runMigrations() {
  console.log("==================================================");
  console.log("RUST & REVIVE — DATABASE MIGRATION RUNNER (Phase 9)");
  console.log("==================================================");

  const migrationFile = "supabase/migrations/20260819_005_production_performance_indexes.sql";
  console.log(`Applying performance indexes: ${migrationFile}...`);
  const sql = fs.readFileSync(migrationFile, "utf8");

  try {
    await executeSql(sql);
    console.log("✅ Phase 9 Performance Composite Indexes applied successfully!");

    console.log("Notifying PostgREST to reload schema cache...");
    await executeSql("NOTIFY pgrst, 'reload schema';");
    console.log("✅ PostgREST schema cache reloaded!");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
}

runMigrations();
