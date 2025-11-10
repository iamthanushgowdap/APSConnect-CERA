-- Check if EEE branch and groups were created
SELECT * FROM public.branches WHERE name = 'EEE';

-- Check if EEE groups exist
SELECT id, name, branch, semester, type FROM public.groups WHERE branch = 'EEE' ORDER BY semester;

-- Check if admin is assigned to EEE groups
SELECT gm.group_id, g.name, gm.can_post
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5' -- Replace with actual admin ID
  AND g.branch = 'EEE';

-- Check current RLS policies on groups
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'groups';

-- If groups exist but aren't visible, try disabling RLS temporarily
-- ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
