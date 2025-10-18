// Import the Supabase client
import { createClient } from '@supabase/supabase-js'

// TODO: Add your Supabase URL and anon key
// Get these from your Supabase project dashboard: https://supabase.com/dashboard
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)