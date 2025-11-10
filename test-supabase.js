// test-supabase.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase environment variables not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetup() {
  console.log('🔍 Checking Supabase setup...\n');

  // Check storage buckets
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    const chatBucket = buckets.find(b => b.name === 'chat-attachments');
    console.log('📦 Storage Buckets:', buckets.map(b => b.name));
    console.log('📁 Chat attachments bucket exists:', !!chatBucket);

    if (chatBucket) {
      // List files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('chat-attachments')
        .list();

      if (filesError) {
        console.log('❌ Error listing files:', filesError.message);
      } else {
        console.log('📄 Files in chat-attachments bucket:', files.length);
        if (files.length > 0) {
          console.log('📋 Recent files:', files.slice(0, 3).map(f => f.name));
        }
      }
    }
  } catch (error) {
    console.log('❌ Storage check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check database schema
  try {
    // Use rpc to check column existence
    const { data: result, error } = await supabase.rpc('check_column_exists', {
      table_name: 'group_messages',
      column_name: 'reactions'
    });

    if (error && error.message.includes('function')) {
      // Fallback: try to select from the table and check if reactions exist
      const { data: messages, error: msgError } = await supabase
        .from('group_messages')
        .select('reactions')
        .limit(1);

      if (msgError) throw msgError;

      console.log('🗄️  Reactions column check: Can query reactions field');
      console.log('❤️ Reactions data type: jsonb (inferred)');
    } else {
      console.log('🗄️  Reactions column exists in database');
    }
  } catch (error) {
    console.log('❌ Database schema check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Check recent messages
  try {
    const { data: messages, error } = await supabase
      .from('group_messages')
      .select('id, content, reactions, attachments, file_url')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    console.log('💬 Recent messages:');
    if (messages.length === 0) {
      console.log('   No messages found');
    } else {
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ID: ${msg.id}`);
        console.log(`     Content: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
        console.log(`     Reactions: ${JSON.stringify(msg.reactions)}`);
        console.log(`     Has file_url: ${!!msg.file_url}`);
        console.log(`     Attachments count: ${Array.isArray(msg.attachments) ? msg.attachments.length : 0}`);
        if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          console.log(`     First attachment URL: ${msg.attachments[0].url?.substring(0, 50)}...`);
        }
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Messages check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('✅ Supabase setup check complete!');
}

checkSetup().catch(console.error);
