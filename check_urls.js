// Check what avatar URLs look like in the database
const fetch = require('node-fetch');

async function checkAvatarUrls() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    // Get users with avatars
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name,role,avatar_url&avatar_url=neq.null&limit=3`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersRes.json();
    console.log('👥 USERS WITH AVATARS:');
    console.log(JSON.stringify(users, null, 2));

    // Get recent messages with avatars
    const messagesRes = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?select=id,author_name,author_avatar_url&author_avatar_url=neq.null&limit=3`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const messages = await messagesRes.json();
    console.log('\n💬 MESSAGES WITH AVATARS:');
    console.log(JSON.stringify(messages, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAvatarUrls();
