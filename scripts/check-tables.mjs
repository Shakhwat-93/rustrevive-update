import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "http://supabasekong-n95ugz0lqx76mpheb0sxaaa2.187.127.218.211.sslip.io",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NzA4NDcwMCwiZXhwIjo0OTQyNzU4MzAwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.94q8rW46-LINP4rCg3LHuKa4GmBQf-R9wQ0jszSJwEQ"
);

async function main() {
  const { data, error } = await supabase.from("notifications").select("id").limit(1);
  console.log("Notifications select result:", { data, error });

  const { data: pushData, error: pushError } = await supabase.from("admin_push_subscriptions").select("id").limit(1);
  console.log("admin_push_subscriptions select result:", { pushData, pushError });
}

main();
