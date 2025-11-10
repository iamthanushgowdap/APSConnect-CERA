-- Check current RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Alternative: If the table has text ID but auth uses UUID, we need to handle the conversion
-- Check what auth.uid() returns vs what the table expects

-- Option 1: Change the table to use UUID (recommended)
-- ALTER TABLE user_profiles ALTER COLUMN id TYPE UUID USING id::uuid;

-- Option 2: Keep text but ensure auth queries work with text conversion
-- The auth provider should convert UUID to text when querying
