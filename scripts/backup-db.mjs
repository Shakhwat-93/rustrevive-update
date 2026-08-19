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

async function createBackup() {
  console.log("==================================================");
  console.log("RUST & REVIVE — DATABASE BACKUP & EXPORT UTILITY");
  console.log("==================================================");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `rustrevive_backup_${timestamp}.json`);

  try {
    // 1. Fetch List of Tables
    const tables = await executeSql(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log(`Found ${tables.length} public tables. Starting data extraction...`);

    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      databaseUrl: url,
      tables: {},
      summary: {},
    };

    for (const t of tables) {
      const tableName = t.table_name;
      try {
        const rows = await executeSql(`SELECT * FROM public."${tableName}";`);
        backupData.tables[tableName] = rows;
        backupData.summary[tableName] = rows.length;
        console.log(`  ✓ Backed up table: ${tableName} (${rows.length} rows)`);
      } catch (err) {
        console.warn(`  ⚠ Warning: Could not dump table ${tableName}:`, err.message);
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf8");

    const stats = fs.statSync(backupFile);
    console.log("==================================================");
    console.log(`✅ Backup successfully generated and verified!`);
    console.log(`File: ${backupFile}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Backup failed:", err.message);
    process.exit(1);
  }
}

createBackup();
