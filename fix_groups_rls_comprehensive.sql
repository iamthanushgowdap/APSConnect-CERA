-- Check and fix RLS policies for groups table to allow admin operations

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'groups';

-- Ensure RLS is enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Allow authenticated users to read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow admin group management" ON public.groups;
DROP POLICY IF EXISTS "Allow members to read their groups" ON public.groups;

-- Create comprehensive admin policy that allows ALL operations
CREATE POLICY "Admin full access to groups" ON public.groups
FOR ALL USING (
  (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- Allow authenticated users to read groups (for members)
CREATE POLICY "Members can read their groups" ON public.groups
FOR SELECT USING (
  id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id::text = auth.uid()::text
  )
);

-- Test policy by checking if we can query
SELECT COUNT(*) as groups_count FROM public.groups LIMIT 1;
