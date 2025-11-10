-- Test what getMyGroups query returns for admin

-- Simulate the getMyGroups query
SELECT
  gm.group_id,
  gm.can_post,
  g.id,
  g.name,
  g.type,
  g.branch,
  g.semester,
  g.description
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id::text = 'e319d9e9-fa72-4043-98ae-9384091c14a5'::text
ORDER BY g.name;

-- Check if the join is working
SELECT 'Group members for admin:' as check, COUNT(*) as count
FROM public.group_members gm
WHERE gm.user_id::text = 'e319d9e9-fa72-4043-98ae-9384091c14a5'::text;

SELECT 'Groups table access:' as check, COUNT(*) as count
FROM public.groups;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'groups' AND schemaname = 'public';

-- If RLS is still enabled, disable it
-- ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
