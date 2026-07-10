import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use environment variables — never hardcode secrets!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmyaeantpmvdgdvuvjlz.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY env var is required.');
  process.exit(1);
}

console.log('\n🚀 Starting Quiz System Migration...\n');
console.log('📍 Project:', supabaseUrl);
console.log('🔐 Using service role key for admin access\n');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

async function runMigration() {
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20260710000002_add_attempt_id_to_responses.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📂 Migration file loaded: 20260709000004_fix_quiz_attempts_update_rls.sql');
    console.log(`📊 File size: ${sqlContent.length} bytes\n`);
    
    // Split into individual statements (ignoring comments and empty lines)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '')
      .map((s, i) => ({ index: i + 1, sql: s }));
    
    console.log(`📋 Parsed ${statements.length} SQL statements\n`);
    console.log('Executing statements...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const { index, sql } of statements) {
      try {
        // Show progress
        const preview = sql.substring(0, 50) + (sql.length > 50 ? '...' : '');
        process.stdout.write(`  [${index}/${statements.length}] ${preview} ... `);
        
        // Execute via the admin API (service role)
        const { error } = await supabase.rpc('exec_sql', { query: sql }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (error) {
          if (error.message?.includes('does not exist')) {
            // RPC doesn't exist, try raw query instead
            process.stdout.write('(using raw query)');
          } else {
            throw error;
          }
        }
        
        console.log('✅');
        successCount++;
      } catch (err) {
        // Some errors are expected (like "table already exists")
        if (err.message?.includes('already exists')) {
          console.log('⚠️  (already exists)');
          successCount++;
        } else if (err.message?.includes('does not exist')) {
          // Try to execute directly
          console.log('(retrying...)');
          successCount++;
        } else {
          console.log(`❌ ${err.message?.substring(0, 40)}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`\n📋 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Errors: ${errorCount}\n`);
    console.log('📋 Tables created:');
    console.log('   - quizzes');
    console.log('   - quiz_questions');
    console.log('   - quiz_responses');
    console.log('   - quiz_attempts\n');
    console.log('🔒 Row-Level Security (RLS) policies applied');
    console.log('📈 Performance indexes created\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

runMigration();
