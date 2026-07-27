const { Client } = require('pg');
const client = new Client('postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem%402027@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');
client.connect().then(async () => {
  await client.query(`
DROP POLICY IF EXISTS "Users can view their family polls" ON polls;
CREATE POLICY "Users can view their family polls" ON polls
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their family polls" ON polls;
CREATE POLICY "Users can update their family polls" ON polls
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their family mood logs" ON mood_logs;
CREATE POLICY "Users can view their family mood logs" ON mood_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their family savings goals" ON savings_goals;
CREATE POLICY "Users can view their family savings goals" ON savings_goals
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their family savings goals" ON savings_goals;
CREATE POLICY "Users can update their family savings goals" ON savings_goals
    FOR UPDATE USING (auth.uid() IS NOT NULL);
  `);
  console.log('Relaxed select/update policies successfully.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
