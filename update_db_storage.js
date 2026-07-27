const { Client } = require('pg');
const client = new Client('postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem%402027@aws-0-eu-west-1.pooler.supabase.com:6543/postgres');
client.connect().then(async () => {
  await client.query(`
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS storage_limit_bytes bigint DEFAULT 1073741824,
    ADD COLUMN IF NOT EXISTS storage_used_bytes bigint DEFAULT 0;
    
    -- Set existing parents to 2GB
    UPDATE profiles SET storage_limit_bytes = 2147483648 WHERE role IN ('parent', 'adult');
    
    -- Set existing visitors to 100MB
    UPDATE profiles SET storage_limit_bytes = 104857600 WHERE role = 'visitor';
  `);
  console.log('Successfully updated profiles schema with storage limits.');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
