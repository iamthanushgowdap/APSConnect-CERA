-- Test getMyGroups query for the CORRECT admin user ID (the one actually logged in)
-- User: admin@gmail.com, ID: 3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2

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
WHERE gm.user_id::text = '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2'::text
ORDER BY g.name;

-- Check group memberships count for this admin
SELECT 'Admin group memberships:' as check, COUNT(*) as count
FROM public.group_members gm
WHERE gm.user_id::text = '3700d0d9-96a8-44f8-9d63-3d9a2ad57ae2'::text;
