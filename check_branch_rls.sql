-- Check RLS policies on branches table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'branches';

-- Also check if admin user has the right permissions
-- SELECT id, email, role FROM user_profiles WHERE role = 'admin';

-- Test direct insert (replace 'TEST_BRANCH' with actual branch name)
-- INSERT INTO public.branches (name, created_at, updated_at)
-- VALUES ('TEST_BRANCH', NOW(), NOW())
-- ON CONFLICT (name) DO NOTHING;
