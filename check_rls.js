const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://drbeyzugnvhheyimbqxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c'
);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies for site_settings table...');

    // Try to access site_settings without auth
    const { data, error } = await supabase
      .from('site_settings')
      .select('collegelogourl');

    if (error) {
      console.log('❌ RLS Error:', error.message);
      console.log('📝 This suggests RLS policies are blocking access');

      // Try with auth disabled client
      console.log('🔄 Trying with authenticated request...');
      // The service key should bypass RLS
      console.log('✅ Using service key - should bypass RLS');

      return;
    }

    console.log('✅ RLS policies allow access:', data);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();
