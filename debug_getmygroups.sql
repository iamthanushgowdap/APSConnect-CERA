-- Debug why getMyGroups is not returning EEE groups

-- Check admin's user ID format
SELECT 'Admin user ID:' as check, id FROM public.user_profiles WHERE email LIKE '%admin%';

-- Check group memberships for admin
SELECT gm.user_id, gm.group_id, g.name, g.branch
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
WHERE gm.user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5' -- Replace with actual admin ID
ORDER BY g.branch, g.name;

-- Test the exact query used by getMyGroups
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
WHERE gm.user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5' -- Replace with actual admin ID
ORDER BY g.name;

-- Check if there are any RLS issues
SELECT COUNT(*) as groups_visible FROM public.groups;
SELECT COUNT(*) as memberships_visible FROM public.group_members WHERE user_id = 'e319d9e9-fa72-4043-98ae-9384091c14a5';
