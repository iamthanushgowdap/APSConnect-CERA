const fetch = require('node-fetch');

async function checkAvatars() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    // Check user profiles with avatars
    console.log('🔍 Checking user profiles with avatars...');
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name,role,avatar_url&not=avatar_url.is.null&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const profiles = await profilesResponse.json();
    console.log('👥 Users with avatars:', profiles.map(p => ({ id: p.id, name: p.full_name, role: p.role, hasAvatar: !!p.avatar_url })));

    // Check recent group messages
    console.log('\n💬 Checking recent group messages...');
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?select=id,author_uid,author_name,author_avatar_url,content&limit=10&order=timestamp.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const messages = await messagesResponse.json();
    console.log('📝 Recent messages:', messages.map(m => ({
      id: m.id,
      author: m.author_name,
      author_uid: m.author_uid,
      hasAvatar: !!m.author_avatar_url,
      content: m.content?.substring(0, 50)
    })));

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAvatars();
