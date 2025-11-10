const fetch = require('node-fetch');

async function debugClubAvatars() {
  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ5MTA0NiwiZXhwIjoyMDc0MDY3MDQ2fQ.fC0D4oCoWeLuWA2Dvu1DC3ISmyEalL-nMit6GqLhR3c';

  try {
    console.log('🔍 DEBUGGING CLUB AVATARS...\n');

    // 1. Get all users with their roles and avatars
    console.log('👥 ALL USERS WITH AVATARS:');
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,full_name,email,role,avatar_url&order=role&order=full_name`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const users = await usersResponse.json();
    console.log('Raw users response:', users);

    if (Array.isArray(users)) {
      users.forEach(user => {
        console.log(`  ${user.role?.toUpperCase()}: ${user.full_name || user.email} (ID: ${user.id}) - Avatar: ${user.avatar_url ? '✅ HAS' : '❌ NO'}`);
      });
    } else {
      console.log('Users response is not an array:', users);
    }

    console.log('\n💬 RECENT CLUB MESSAGES:');
    // 2. Get recent group messages
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?select=id,group_id,author_uid,author_name,author_avatar_url,content,timestamp&limit=20&order=timestamp.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const messages = await messagesResponse.json();
    console.log('Raw messages response:', messages);

    if (Array.isArray(messages) && Array.isArray(users)) {
      // Create user lookup map
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = {
          name: user.full_name || user.email,
          role: user.role,
          avatar: user.avatar_url
        };
      });

      // Analyze messages
      messages.forEach(msg => {
        const author = userMap[msg.author_uid];
        const shouldShow = author ? author.avatar : 'UNKNOWN USER';
        const actuallyShows = msg.author_avatar_url || 'NULL in DB';

        console.log(`📝 Message: "${msg.content?.substring(0, 40)}..."`);
        console.log(`   Author: ${author ? `${author.name} (${author.role})` : 'UNKNOWN'} ID: ${msg.author_uid}`);
        console.log(`   Should show: ${shouldShow ? 'USER AVATAR' : 'NO AVATAR'}`);
        console.log(`   DB has: ${actuallyShows ? 'STORED AVATAR' : 'NULL'}`);
        console.log(`   Status: ${shouldShow && actuallyShows ? '✅ CORRECT' : shouldShow && !actuallyShows ? '❌ MISSING' : '⚠️ NO AVATAR EXPECTED'}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugClubAvatars();
