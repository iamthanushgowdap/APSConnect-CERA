const fetch = require('node-fetch');

async function testAvatarUrls() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    console.log('🔍 TESTING AVATAR URL ACCESSIBILITY...\n');

    // Get users with avatars
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name,role,avatar_url&not=avatar_url.is.null&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersResponse.json();

    if (Array.isArray(users)) {
      for (const user of users) {
        console.log(`👤 ${user.full_name} (${user.role}): ${user.avatar_url}`);

        // Test if URL is accessible
        try {
          const testResponse = await fetch(user.avatar_url, { method: 'HEAD' });
          console.log(`   Status: ${testResponse.status} ${testResponse.status === 200 ? '✅ OK' : '❌ FAILED'}\n`);
        } catch (error) {
          console.log(`   Error: ${error.message} ❌ FAILED\n`);
        }
      }
    }

    // Test a few message avatars
    console.log('💬 TESTING MESSAGE AVATARS...\n');
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?select=id,author_name,author_avatar_url&not=author_avatar_url.is.null&limit=3`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const messages = await messagesResponse.json();

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        console.log(`📝 ${msg.author_name}: ${msg.author_avatar_url}`);

        try {
          const testResponse = await fetch(msg.author_avatar_url, { method: 'HEAD' });
          console.log(`   Status: ${testResponse.status} ${testResponse.status === 200 ? '✅ OK' : '❌ FAILED'}\n`);
        } catch (error) {
          console.log(`   Error: ${error.message} ❌ FAILED\n`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAvatarUrls();
