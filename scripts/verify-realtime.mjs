import pg from "pg";

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres:u9ozuSjJv25MxONHehmQTeoddasvOSPk@187.127.218.211:5432/postgres",
});

async function main() {
  await client.connect();
  console.log("Connected to PostgreSQL database.");

  // 1. Check publication tables
  const pubRes = await client.query(`
    SELECT schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime';
  `);
  console.log("Current Realtime Publication Tables:", pubRes.rows.map(r => r.tablename));

  // 2. Ensure orders, order_items, notifications, inventory are in supabase_realtime
  const requiredTables = ["orders", "order_items", "notifications", "inventory", "customer_incomplete_checkouts", "reviews"];
  for (const table of requiredTables) {
    const isAdded = pubRes.rows.some((r) => r.tablename === table);
    if (!isAdded) {
      console.log(`Adding table to supabase_realtime: ${table}`);
      try {
        await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};`);
        console.log(`Successfully added: ${table}`);
      } catch (err) {
        console.error(`Error adding table ${table}:`, err.message);
      }
    } else {
      console.log(`Table already in realtime: ${table}`);
    }
  }

  // 3. Set REPLICA IDENTITY FULL for orders and notifications
  try {
    await client.query(`ALTER TABLE public.orders REPLICA IDENTITY FULL;`);
    await client.query(`ALTER TABLE public.notifications REPLICA IDENTITY FULL;`);
    console.log("REPLICA IDENTITY FULL set for orders & notifications.");
  } catch (err) {
    console.error("Error setting replica identity:", err.message);
  }

  // 4. Verify orders table schema
  const colRes = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'orders'
    ORDER BY ordinal_position;
  `);
  console.log("Orders columns:", colRes.rows.map(r => r.column_name));

  // 5. Verify notifications table schema
  const notifCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'notifications'
    ORDER BY ordinal_position;
  `);
  console.log("Notifications columns:", notifCols.rows.map(r => r.column_name));

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
