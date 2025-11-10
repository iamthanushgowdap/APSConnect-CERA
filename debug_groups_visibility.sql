-- Debug: Check if groups are being created and what RLS policies exist

-- Check all groups (should show the new branch groups)
SELECT id, name, branch, semester, type FROM public.groups ORDER BY branch, semester;

-- Check RLS policies on groups table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'groups';

-- Check if admin can access groups table
SELECT COUNT(*) as total_groups FROM public.groups;

-- Check group memberships for admin
SELECT gm.group_id, g.name, g.branch, gm.can_post
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5'; -- Replace with actual admin ID

-- Check if new branch exists
SELECT * FROM public.branches WHERE name = 'CHEMICAL';
