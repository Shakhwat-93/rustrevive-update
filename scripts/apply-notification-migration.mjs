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
  console.log("Creating admin_push_subscriptions and notification indexes...");
  const sql = `
    CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      admin_id UUID NULL,
      user_agent TEXT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_push_endpoint ON admin_push_subscriptions(endpoint);
    CREATE INDEX IF NOT EXISTS idx_push_active ON admin_push_subscriptions(is_active);
    CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
    CREATE INDEX IF NOT EXISTS idx_notifications_resource ON notifications(resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

    -- Enable Realtime for notifications table
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  `;

  try {
    await executeSql(sql);
    console.log("SQL executed successfully!");

    console.log("Notifying PostgREST to reload schema cache...");
    await executeSql("NOTIFY pgrst, 'reload schema';");
    console.log("PostgREST schema cache reloaded successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

run();
