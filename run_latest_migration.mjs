import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem@2027@xmyaeantpmvdgdvuvjlz.supabase.co:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20260715181601_add_is_archived_to_quizzes.sql'), 'utf-8');
  await client.query(sql);
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log('Migration done!');
  await client.end();
}

run().catch(console.error);
