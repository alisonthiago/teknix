const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const url = "postgresql://postgres:Nego5656%23cotia@db.ykgprfzfnffooqmfbeox.supabase.co:6543/postgres";
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  await client.connect();
  const sql = fs.readFileSync(path.join(__dirname, 'supabase/migrations/20260819165300_update_notifications_structure.sql'), 'utf-8');
  await client.query(sql);
  console.log("Migration executed successfully!");
  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
