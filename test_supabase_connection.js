const { createClient } = require('@supabase/supabase-js');

// Use the same config as the app
const supabase = createClient(
  'https://drbeyzugnvhheyimbqxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c'
);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test 1: Check site_settings table
    console.log('📋 Testing site_settings access...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.log('❌ site_settings error:', settingsError.message);
    } else {
      console.log('✅ site_settings accessible:', !!settingsData);
    }

    // Test 2: Check user_profiles table
    console.log('👤 Testing user_profiles access...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (profilesError) {
      console.log('❌ user_profiles error:', profilesError.message);
    } else {
      console.log('✅ user_profiles accessible:', !!profilesData);
    }

    // Test 3: Check user_preferences table
    console.log('⚙️ Testing user_preferences access...');
    const { data: prefsData, error: prefsError } = await supabase
      .from('user_preferences')
      .select('count')
      .limit(1);

    if (prefsError) {
      console.log('❌ user_preferences error:', prefsError.message);
    } else {
      console.log('✅ user_preferences accessible:', !!prefsData);
    }

    // Test 4: Check drafts table
    console.log('📝 Testing drafts access...');
    const { data: draftsData, error: draftsError } = await supabase
      .from('drafts')
      .select('count')
      .limit(1);

    if (draftsError) {
      console.log('❌ drafts error:', draftsError.message);
    } else {
      console.log('✅ drafts accessible:', !!draftsData);
    }

    console.log('\n🎯 Connection Test Complete!');
    console.log('If all tests show ✅, Supabase is connected and accessible.');

  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
  }
}

testSupabaseConnection();
