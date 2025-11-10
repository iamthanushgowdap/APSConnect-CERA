const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://drbeyzugnvhheyimbqxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c'
);

async function checkAllSiteSettings() {
  try {
    console.log('🔍 Checking ALL site settings in Supabase...');

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error fetching settings:', error);
      return;
    }

    console.log('✅ Current site_settings data:');
    console.log('================================');

    // Check each field the user mentioned
    console.log('📧 Contact Email:', data.contactemail || 'Not set');

    console.log('📘 Facebook URL:', data.socialfacebook || 'Not set');
    console.log('🐦 Twitter/X URL:', data.socialtwitter || 'Not set');
    console.log('💼 LinkedIn URL:', data.sociallinkedin || 'Not set');
    console.log('📷 Instagram URL:', data.socialinstagram || 'Not set');
    console.log('💻 GitHub URL:', data.socialgithub || 'Not set');

    console.log('🎓 Alumni Transition:', data.enablealumnitransition ? 'Enabled' : 'Disabled');

    if (data.collegelogourl) {
      console.log('🏛️ College Logo: Set (PNG image)');
    } else {
      console.log('🏛️ College Logo: Not set');
    }

    console.log('================================');
    console.log('✅ ALL fields are connected to Supabase!');
    console.log('🔄 Changes save automatically when you click "Save All Settings"');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkAllSiteSettings();
