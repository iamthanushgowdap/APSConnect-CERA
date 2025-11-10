const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigrations() {
  try {
    // Read migration files in order
    const migrationFiles = [
      '../migrations/001_create_drafts_table.sql'
    ];

    for (const file of migrationFiles) {
      const sql = require('fs').readFileSync(file, 'utf8');
      console.log(`Running migration: ${file}`);
      
      const { data, error } = await supabase.rpc('execute', { query: sql });
      
      if (error) {
        throw error;
      }
      
      console.log(`Migration successful: ${file}`);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
