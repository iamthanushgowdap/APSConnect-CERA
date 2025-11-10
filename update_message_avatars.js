// Script to update existing group messages with correct author avatars
const { createClient } = require('@supabase/supabase-js');

// You'll need to provide your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateExistingMessageAvatars() {
  console.log('🔄 Starting avatar update for existing group messages...');

  try {
    // Get all group messages that have null or empty author_avatar_url
    const { data: messagesToUpdate, error: fetchError } = await supabase
      .from('group_messages')
      .select('id, author_uid, author_avatar_url')
      .or('author_avatar_url.is.null,author_avatar_url.eq.');

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError);
      return;
    }

    console.log(`📊 Found ${messagesToUpdate.length} messages to update`);

    // Group messages by author_uid to batch profile lookups
    const authorUids = [...new Set(messagesToUpdate.map(msg => msg.author_uid))];

    // Fetch all author profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, avatar_url')
      .in('id', authorUids);

    if (profileError) {
      console.error('❌ Error fetching profiles:', profileError);
      return;
    }

    // Create a map of author_uid -> avatar_url
    const avatarMap = {};
    profiles.forEach(profile => {
      avatarMap[profile.id] = profile.avatar_url;
    });

    console.log('📋 Avatar map created:', avatarMap);

    // Update messages in batches
    let updatedCount = 0;
    for (const message of messagesToUpdate) {
      const correctAvatar = avatarMap[message.author_uid];

      if (correctAvatar) {
        const { error: updateError } = await supabase
          .from('group_messages')
          .update({ author_avatar_url: correctAvatar })
          .eq('id', message.id);

        if (updateError) {
          console.error(`❌ Error updating message ${message.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ Updated message ${message.id} with avatar for author ${message.author_uid}`);
        }
      } else {
        console.log(`⚠️ No avatar found for author ${message.author_uid}, skipping message ${message.id}`);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} messages with correct avatars`);

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
updateExistingMessageAvatars();
