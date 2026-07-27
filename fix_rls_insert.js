const { Client } = require('pg');
const client = new Client('postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem%402027@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');
client.connect().then(async () => {
  await client.query(`
DROP POLICY IF EXISTS "Users can insert family polls" ON polls;
CREATE POLICY "Users can insert family polls" ON polls
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert family mood logs" ON mood_logs;
CREATE POLICY "Users can insert family mood logs" ON mood_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert family savings goals" ON savings_goals;
CREATE POLICY "Users can insert family savings goals" ON savings_goals
    FOR INSERT WITH CHECK (true);
  `);
  console.log('Relaxed insert policies successfully.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
