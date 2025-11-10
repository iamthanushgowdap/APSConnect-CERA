-- Check if user_profiles table exists and has data
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check current RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- If RLS is causing issues, temporarily disable it
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Test a simple query
SELECT id, email, role, full_name FROM user_profiles LIMIT 3;
