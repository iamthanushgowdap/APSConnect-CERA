#!/usr/bin/env node

// Script to check if user_preferences table exists and create it if needed
// Run with: node check-user-preferences-table.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateUserPreferencesTable() {
  try {
    console.log('🔍 Checking if user_preferences table exists...');

    // Try to select from the table
    const { data, error } = await supabase
      .from('user_preferences')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Table exists but is empty');
        return true;
      } else if (error.message.includes('relation "public.user_preferences" does not exist')) {
        console.log('❌ Table does not exist. Please create it manually in Supabase SQL Editor:');

        const createSQL = `
-- Create user_preferences table for storing user settings like theme, language, and voice
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi', 'kn', 'te')),
    voice_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        console.log('\n📋 Copy and paste this SQL into your Supabase SQL Editor:\n');
        console.log(createSQL);

        return false;
      } else {
        console.error('❌ Unexpected error:', error);
        return false;
      }
    } else {
      console.log('✅ Table exists and has', data, 'rows');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking table:', error);
    return false;
  }
}

async function testTableOperations() {
  try {
    console.log('\n🧪 Testing table operations...');

    // Test insert
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const { error: insertError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: testUserId,
        theme: 'dark',
        language: 'kn',
        voice_enabled: true
      });

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return false;
    } else {
      console.log('✅ Insert test passed');
    }

    // Test select
    const { data: selectData, error: selectError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (selectError) {
      console.error('❌ Select test failed:', selectError);
      return false;
    } else {
      console.log('✅ Select test passed:', selectData);
    }

    // Clean up test data
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', testUserId);

    console.log('✅ All table operations working correctly');
    return true;

  } catch (error) {
    console.error('❌ Error testing table operations:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 CERA User Preferences Table Setup\n');

  const tableExists = await checkAndCreateUserPreferencesTable();

  if (tableExists) {
    await testTableOperations();
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Create the table using the SQL above in Supabase dashboard');
  console.log('2. Restart your Next.js development server');
  console.log('3. Test language/theme commands in the CERA chat');
  console.log('4. Check server logs for debug information');

  console.log('\n🎯 Expected behavior after setup:');
  console.log('- "language kannada" should switch responses to Kannada');
  console.log('- "theme dark" should apply dark theme to responses');
  console.log('- Preferences should persist across browser sessions');
}

main().catch(console.error);
