-- Debug: Check what's happening with group creation
-- This will help identify why groups aren't being created

-- Check current RLS policies on groups table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, cmd
FROM pg_policies WHERE tablename = 'groups';

-- Check if the groups table allows inserts
SELECT 'Groups table permissions test' as test;
SELECT COUNT(*) as existing_groups FROM public.groups;

-- Try to insert a test group manually
-- INSERT INTO public.groups (id, name, type, branch, semester, description)
-- VALUES ('test_group_' || extract(epoch from now()), 'Test Group', 'official', 'TEST', '1st Sem', 'Test group creation')
-- ON CONFLICT (id) DO NOTHING;

-- Check what user is trying to create the branch (from auth context)
-- The createBranch function uses auth.getUser() to get the current user
