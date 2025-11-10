-- Simple debug - what groups exist and who is assigned to what

-- All groups:
SELECT id, name, branch, semester, type FROM public.groups ORDER BY branch, semester;

-- Current assignments for admin/faculty:
SELECT
  up.email,
  up.role,
  COUNT(gm.group_id) as groups_assigned,
  STRING_AGG(g.name, ', ') as group_names
FROM public.user_profiles up
LEFT JOIN public.group_members gm ON up.id = gm.user_id
LEFT JOIN public.groups g ON gm.group_id = g.id
WHERE up.role IN ('admin', 'faculty')
GROUP BY up.id, up.email, up.role
ORDER BY up.role, up.email;
