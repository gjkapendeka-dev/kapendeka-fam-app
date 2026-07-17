const { Client } = require('pg');
const fs = require('fs');

async function runMigrations() {
    const client = new Client({
        connectionString: 'postgresql://postgres.xmyaeantpmvdgdvuvjlz:NewJerusalem%402027@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'
    });
    
    await client.connect();
    
    try {
        const sql1 = fs.readFileSync('supabase/migrations/20260717000000_add_time_capsules.sql', 'utf8');
        console.log('Running migration 0...');
        await client.query(sql1);

        const sql2 = fs.readFileSync('supabase/migrations/20260717000001_add_medical_id.sql', 'utf8');
        console.log('Running migration 1...');
        await client.query(sql2);

        const sql3 = fs.readFileSync('supabase/migrations/20260717000002_add_wiki.sql', 'utf8');
        console.log('Running migration 2...');
        await client.query(sql3);
        
        console.log("All migrations ran successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

runMigrations();
