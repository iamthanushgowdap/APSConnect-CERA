-- Debug: Check all groups and memberships
-- Run this to see what's actually in the database

-- Check all groups
SELECT id, name, type, branch, semester FROM public.groups ORDER BY type, branch, semester;

-- Check all group memberships
SELECT
  gm.group_id,
  g.name as group_name,
  g.type,
  gm.user_id,
  up.email,
  up.role,
  up.branch as user_branch,
  up.assigned_branches,
  gm.can_post
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
JOIN public.user_profiles up ON gm.user_id = up.id
ORDER BY up.role, g.type, g.branch;

-- Check specific admin/faculty users
SELECT id, email, role, branch, assigned_branches, assigned_semesters
FROM public.user_profiles
WHERE role IN ('admin', 'faculty')
ORDER BY role, email;

-- Check branches table
SELECT * FROM public.branches ORDER BY name;
