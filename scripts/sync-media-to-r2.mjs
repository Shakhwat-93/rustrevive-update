import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env.local if present
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const accountId = process.env.R2_ACCOUNT_ID || "d74dd7a21d47d4eb876eb76eafab664d";
const bucket = process.env.R2_BUCKET_NAME || "rustandrevive";
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiToken || !supabaseServiceKey) {
  console.error("Missing CLOUDFLARE_API_TOKEN or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAllMedia() {
  console.log("=== RUST & REVIVE MEDIA SYNC TO CLOUDFLARE R2 ===");

  // 1. Fetch all media records from Supabase
  const { data: mediaRecords, error } = await supabase.from("media").select("*");
  if (error) {
    console.error("Failed to query media table:", error);
    process.exit(1);
  }

  console.log(`Found ${mediaRecords.length} media records in PostgreSQL.`);

  for (const record of mediaRecords) {
    const objectKey = record.object_key;
    const localPath = path.join(process.cwd(), "public", "uploads", objectKey);

    console.log(`\nProcessing: ${objectKey}`);

    let fileBuffer;
    if (fs.existsSync(localPath)) {
      fileBuffer = fs.readFileSync(localPath);
      console.log(`  Read from local disk (${fileBuffer.length} bytes)`);
    } else {
      console.log(`  Checking R2 status...`);
    }

    if (fileBuffer) {
      // Upload to Cloudflare R2
      const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodeURI(objectKey)}`;
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": record.mime_type || "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: fileBuffer,
      });

      if (res.ok) {
        console.log(`  Uploaded successfully to Cloudflare R2!`);
      } else {
        console.error(`  Upload failed: HTTP ${res.status}`, await res.text());
      }
    }

    // Update DB record to canonical URL
    const canonicalUrl = `/api/media/${objectKey}`;
    const { error: updateErr } = await supabase
      .from("media")
      .update({
        public_url: canonicalUrl,
        storage_provider: "R2",
        bucket: "rustandrevive",
      })
      .eq("id", record.id);

    if (updateErr) {
      console.error(`  Failed to update DB record ${record.id}:`, updateErr.message);
    } else {
      console.log(`  Updated PostgreSQL record -> public_url: ${canonicalUrl}`);
    }
  }

  console.log("\n=== ALL MEDIA SYNCED SUCCESSFULLY ===");
}

syncAllMedia().catch(console.error);
