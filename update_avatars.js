const fetch = require('node-fetch');

async function updateAvatars() {
  console.log('🔄 Updating group message avatars...');

  const SUPABASE_URL = 'https://drbeyzugnvhheyimbqxn.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyYmV5enVnbnZoaGV5aW1icXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0OTEwNDYsImV4cCI6MjA3NDA2NzA0Nn0.3eTS2sGXRPv-osBp34_ZS4O1jMkf6DG3g2yDZmkXuTg';

  try {
    // Fetch messages without avatars
    const messagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?select=id,author_uid,author_avatar_url&or=(author_avatar_url.is.null,author_avatar_url.eq.)`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const messagesToUpdate = await messagesResponse.json();
    console.log(`📊 Found ${messagesToUpdate.length} messages to update`);

    if (messagesToUpdate.length === 0) return;

    // Get unique author UIDs
    const authorUids = [...new Set(messagesToUpdate.map(msg => msg.author_uid).filter(Boolean))];

    // Fetch author profiles
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=id,avatar_url&id=in.(${authorUids.join(',')})`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const profiles = await profileResponse.json();

    // Create avatar map
    const avatarMap = {};
    profiles.forEach(profile => {
      avatarMap[profile.id] = profile.avatar_url;
    });

    console.log('📋 Avatar map:', avatarMap);

    // Update messages
    let updatedCount = 0;
    for (const message of messagesToUpdate) {
      const correctAvatar = avatarMap[message.author_uid];

      if (correctAvatar) {
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_messages?id=eq.${message.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ author_avatar_url: correctAvatar })
        });

        if (updateResponse.ok) {
          updatedCount++;
          console.log(`✅ Updated message ${message.id} for author ${message.author_uid}`);
        } else {
          console.error(`❌ Failed to update message ${message.id}`);
        }
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} messages`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

updateAvatars();
