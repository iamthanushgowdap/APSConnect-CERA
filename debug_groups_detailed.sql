-- Debug: Check what groups exist and what assignments were made

-- What groups actually exist?
SELECT id, name, branch, semester, type FROM public.groups ORDER BY branch, semester;

-- What assignments exist for admin/faculty?
SELECT
  up.email,
  up.role,
  g.name as group_name,
  g.branch,
  g.semester,
  gm.can_post
FROM public.user_profiles up
JOIN public.group_members gm ON up.id = gm.user_id
JOIN public.groups g ON gm.group_id = g.id
WHERE up.role IN ('admin', 'faculty')
ORDER BY up.email, g.branch, g.semester;

-- Count by user and group type
SELECT
  up.email,
  up.role,
  g.type,
  COUNT(*) as count
FROM public.user_profiles up
JOIN public.group_members gm ON up.id = gm.user_id
JOIN public.groups g ON gm.group_id = g.id
WHERE up.role IN ('admin', 'faculty')
GROUP BY up.email, up.role, g.type
ORDER BY up.email, g.type;
