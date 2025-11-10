const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://drbeyzugnvhheyimbqxn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c'
);

async function checkCurrentLogo() {
  try {
    console.log('🔍 Checking current logo in site_settings...');

    const { data, error } = await supabase
      .from('site_settings')
      .select('collegelogourl')
      .single();

    if (error) {
      console.error('❌ Error fetching logo:', error);
      return;
    }

    if (data?.collegelogourl) {
      console.log('✅ Logo found in Supabase!');
      console.log('📏 Logo data length:', data.collegelogourl.length, 'characters');

      // Check if it's a data URL
      if (data.collegelogourl.startsWith('data:')) {
        console.log('📷 Logo is a data URL (base64 encoded image)');

        // Extract MIME type
        const mimeMatch = data.collegelogourl.match(/^data:([^;]+)/);
        if (mimeMatch) {
          console.log('🎨 Logo type:', mimeMatch[1]);
        }
      } else if (data.collegelogourl.startsWith('http')) {
        console.log('🔗 Logo is a URL:', data.collegelogourl.substring(0, 50) + '...');
      } else {
        console.log('❓ Logo format unknown');
      }

      console.log('\n💡 The logo should appear in the navbar automatically!');
      console.log('🔄 If not visible, try:');
      console.log('   1. Hard refresh (Ctrl+F5)');
      console.log('   2. Clear browser cache');
      console.log('   3. Check browser console for errors');

    } else {
      console.log('❌ No logo found in Supabase');
      console.log('📤 You need to upload a logo in Admin Settings first');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCurrentLogo();
