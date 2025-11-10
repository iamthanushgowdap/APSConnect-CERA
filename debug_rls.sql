-- Temporarily disable RLS to test if that's causing the 406 errors
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Test query (should work now)
SELECT * FROM user_profiles LIMIT 1;

-- If this works, the issue is with RLS policies
-- Re-enable RLS after testing
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';
