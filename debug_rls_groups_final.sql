-- Check current RLS policies and fix any issues

-- View current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'groups';

-- If policies are broken, drop them all and recreate
DROP POLICY IF EXISTS "Allow authenticated users to read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow admin group management" ON public.groups;
DROP POLICY IF EXISTS "Members can read their groups" ON public.groups;

-- Temporarily disable RLS to test if it's the issue
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- Test by trying to create a test group
-- INSERT INTO public.groups (id, name, type, branch, semester, description)
-- VALUES ('test_group_' || extract(epoch from now()), 'Test Group', 'official', 'TEST', '1st Sem', 'Test group creation');

-- Check if we can query groups
SELECT COUNT(*) as groups_count FROM public.groups;

-- If that works, re-enable RLS with simple policy
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Simple group access" ON public.groups FOR ALL USING (true);
