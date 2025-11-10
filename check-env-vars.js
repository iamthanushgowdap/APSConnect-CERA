// Check environment variables
require('dotenv').config();

console.log('🔍 Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ NOT SET');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.log('\n🚨 CRITICAL: No Supabase URL found!');
  console.log('You need to set either NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your .env.local file');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n🚨 CRITICAL: No Supabase key found!');
  console.log('You need to set either NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY');
}
