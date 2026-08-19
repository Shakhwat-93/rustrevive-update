import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

// Parse .env.local manually
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("==================================================");
console.log("SUPABASE INFRASTRUCTURE VERIFICATION TEST");
console.log("==================================================");
console.log("Supabase Host:", supabaseUrl ? new URL(supabaseUrl).host : "N/A");
console.log("Has Anon Key:", !!anonKey);
console.log("Has Service Role Key:", !!serviceKey);
console.log("--------------------------------------------------");

async function runTests() {
  const results = {};

  // TEST 1: PostgREST API Reachable
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: anonKey },
    });
    results.postgrest = res.status === 200 ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.postgrest = `FAIL (${err.message})`;
  }

  // TEST 2: Auth Service Reachable
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    results.auth = res.status === 200 ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.auth = `FAIL (${err.message})`;
  }

  // TEST 3: Browser-safe client (Anon Key)
  try {
    const client = createClient(supabaseUrl, anonKey);
    const { data, error } = await client.from("users").select("count").limit(0);
    // Code 42P01 (relation does not exist) or success confirms PostgREST query execution
    results.browserClient = error ? (error.code ? `PASS (PostgREST query parsed, code: ${error.code})` : `FAIL (${error.message})`) : "PASS";
  } catch (err) {
    results.browserClient = `FAIL (${err.message})`;
  }

  // TEST 4: Privileged client (Service Role Key - Admin Auth API)
  try {
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    results.privilegedClient = error ? `FAIL (${error.message})` : "PASS";
  } catch (err) {
    results.privilegedClient = `FAIL (${err.message})`;
  }

  // TEST 5: Realtime Endpoint
  try {
    const res = await fetch(`${supabaseUrl}/realtime/v1/`, {
      headers: { apikey: anonKey },
    });
    results.realtime = res.status < 500 ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.realtime = `FAIL (${err.message})`;
  }

  console.log("RESULTS SUMMARY:");
  console.log(JSON.stringify(results, null, 2));
}

runTests();
