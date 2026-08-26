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
  console.log("Creating marketing_tracking_settings & server_analytics_logs tables...");
  const sql = `
    CREATE TABLE IF NOT EXISTS marketing_tracking_settings (
      id TEXT PRIMARY KEY DEFAULT 'marketing_tracking_singleton',
      gtm_enabled BOOLEAN NOT NULL DEFAULT false,
      gtm_container_id TEXT,
      ga4_enabled BOOLEAN NOT NULL DEFAULT false,
      ga4_measurement_id TEXT,
      meta_pixel_enabled BOOLEAN NOT NULL DEFAULT false,
      meta_pixel_id TEXT,
      meta_capi_enabled BOOLEAN NOT NULL DEFAULT false,
      meta_capi_access_token TEXT,
      meta_test_event_code TEXT,
      tiktok_pixel_enabled BOOLEAN NOT NULL DEFAULT false,
      tiktok_pixel_id TEXT,
      tiktok_events_api_enabled BOOLEAN NOT NULL DEFAULT false,
      tiktok_events_api_access_token TEXT,
      tiktok_test_event_code TEXT,
      ecommerce_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
      debug_tracking_enabled BOOLEAN NOT NULL DEFAULT false,
      consent_mode_enabled BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Insert default singleton record if not present
    INSERT INTO marketing_tracking_settings (id, gtm_enabled, ga4_enabled, meta_pixel_enabled, meta_capi_enabled, tiktok_pixel_enabled, tiktok_events_api_enabled, ecommerce_tracking_enabled, debug_tracking_enabled, consent_mode_enabled)
    VALUES ('marketing_tracking_singleton', false, false, false, false, false, false, true, false, false)
    ON CONFLICT (id) DO NOTHING;

    -- Create server-side analytics delivery log table for CAPI and Events API
    CREATE TABLE IF NOT EXISTS server_analytics_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id TEXT NOT NULL,
      event_name TEXT NOT NULL,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      provider TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempt_count INT NOT NULL DEFAULT 1,
      payload JSONB,
      response_data JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_server_analytics_event_id ON server_analytics_logs (event_id, provider);
    CREATE INDEX IF NOT EXISTS idx_server_analytics_order_id ON server_analytics_logs (order_id);

    -- Reload PostgREST schema cache
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    await executeSql(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

run();
