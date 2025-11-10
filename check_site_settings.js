const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://drbeyzugnvhheyimbqxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c'
);

async function checkSiteSettings() {
  try {
    console.log('🔍 Checking site_settings table...');

    // Check if table exists and has data
    const { data, error } = await supabase
      .from('site_settings')
      .select('*');

    if (error) {
      console.error('❌ Error accessing site_settings:', error);
      return;
    }

    console.log('✅ site_settings data:', data);

    if (data.length === 0) {
      console.log('📝 No data in site_settings, creating default record...');

      const { data: insertData, error: insertError } = await supabase
        .from('site_settings')
        .insert({
          collegelogourl: null,
          contactemail: null,
          socialfacebook: null,
          socialtwitter: null,
          sociallinkedin: null,
          socialinstagram: null,
          socialgithub: null,
          enablealumnitransition: false
        })
        .select();

      if (insertError) {
        console.error('❌ Error creating site_settings record:', insertError);
      } else {
        console.log('✅ Created default site_settings record:', insertData);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSiteSettings();
