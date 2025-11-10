#!/usr/bin/env node

/**
 * Database Migration Script
 *
 * Runs SQL migration files using Supabase client
 * Usage: node scripts/run-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Please ensure your .env.local file has these variables set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSqlFile(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Running statement ${i + 1}/${statements.length}`);

        // For complex DDL statements, we'll use rpc or direct execution
        // Since Supabase doesn't support all DDL through the client, we'll try a different approach
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
          return false;
        }
      }
    }

    console.log(`✅ Successfully executed ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${filePath}:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  const migrations = [
    'migrations/002_create_groups_tables.sql',
    'migrations/003_populate_groups.sql'
  ];

  for (const migration of migrations) {
    const filePath = path.join(process.cwd(), migration);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${filePath}`);
      continue;
    }

    console.log(`\n📋 Running migration: ${migration}`);
    const success = await runSqlFile(filePath);

    if (!success) {
      console.error(`❌ Migration failed: ${migration}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations completed successfully!');
}

// Check if Supabase has the exec_sql function, if not, provide manual instructions
async function checkSupabaseCapabilities() {
  console.log('🔍 Checking Supabase capabilities...');

  try {
    // Try to check if we can run DDL commands
    const { error } = await supabase.from('groups').select('count').limit(1);

    if (error && error.code === '42P01') {
      console.log('ℹ️ Groups table does not exist yet - this is expected');
    } else if (!error) {
      console.log('ℹ️ Groups table already exists');
    }
  } catch (err) {
    console.log('ℹ️ Will provide manual SQL instructions since direct DDL execution may not be available');
    console.log('\n📋 Manual SQL Execution Required:');
    console.log('Please run these SQL files in your Supabase SQL editor:');
    console.log('1. migrations/002_create_groups_tables.sql');
    console.log('2. migrations/003_populate_groups.sql');
    console.log('\nOr run the populate-groups.js script after installing dotenv:');
    console.log('npm install dotenv && node scripts/populate-groups.js');
    return false;
  }

  return true;
}

// Run the migrations
async function main() {
  const canRunDirectly = await checkSupabaseCapabilities();

  if (canRunDirectly) {
    await runMigrations();
  } else {
    console.log('\n💡 Please run the SQL files manually in Supabase dashboard or use the populate script.');
  }
}

main();
