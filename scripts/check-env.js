#!/usr/bin/env node

require('dotenv').config();

console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'EXISTS' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'EXISTS' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('✅ Supabase configuration found!');
} else {
  console.log('❌ Supabase configuration missing!');
}
