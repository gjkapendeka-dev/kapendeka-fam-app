const { Client } = require('pg');
const client = new Client('postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem%402027@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');
client.connect().then(async () => {
  console.log('Connected!');
  await client.query(`
DROP POLICY IF EXISTS "Enable read access for users in same family" ON polls;
DROP POLICY IF EXISTS "Enable insert for users in same family" ON polls;
DROP POLICY IF EXISTS "Enable update for users in same family" ON polls;

CREATE POLICY "Users can view their family polls" ON polls
    FOR SELECT USING (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert family polls" ON polls
    FOR INSERT WITH CHECK (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update their family polls" ON polls
    FOR UPDATE USING (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable read access for users in same family" ON mood_logs;
DROP POLICY IF EXISTS "Enable insert for users in same family" ON mood_logs;

CREATE POLICY "Users can view their family mood logs" ON mood_logs
    FOR SELECT USING (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert family mood logs" ON mood_logs
    FOR INSERT WITH CHECK (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Enable read access for users in same family" ON savings_goals;
DROP POLICY IF EXISTS "Enable insert for users in same family" ON savings_goals;
DROP POLICY IF EXISTS "Enable update for users in same family" ON savings_goals;

CREATE POLICY "Users can view their family savings goals" ON savings_goals
    FOR SELECT USING (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can insert family savings goals" ON savings_goals
    FOR INSERT WITH CHECK (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users can update their family savings goals" ON savings_goals
    FOR UPDATE USING (family_id = (SELECT family_id FROM profiles WHERE id = auth.uid()));
  `);
  console.log('Updated RLS policies successfully.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
