import pg from "pg";

async function main() {
  const client = new pg.Client({
    connectionString: "postgresql://postgres:u9ozuSjJv25MxONHehmQTeoddasvOSPk@187.127.218.211:5432/postgres",
  });
  await client.connect();
  await client.query(`
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
  `);
  console.log("admin_push_subscriptions table and indexes created successfully in PostgreSQL!");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
