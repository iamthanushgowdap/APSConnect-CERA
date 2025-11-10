-- Debug query to check faculty/admin user profiles and their group assignments
-- Run this to see what data faculty/admin users have

-- Check faculty/admin users and their profile data
SELECT
  id,
  email,
  role,
  branch,
  semester,
  is_approved,
  display_name
FROM public.user_profiles
WHERE role IN ('admin', 'faculty')
ORDER BY role, email;

-- Check what groups exist
SELECT id, name, type, branch, semester
FROM public.groups
ORDER BY type, branch, semester;

-- Check group memberships for faculty/admin
SELECT
  gm.group_id,
  g.name,
  g.type,
  gm.user_id,
  up.email,
  up.role,
  gm.can_post
FROM public.group_members gm
JOIN public.groups g ON gm.group_id = g.id
JOIN public.user_profiles up ON gm.user_id = up.id
WHERE up.role IN ('admin', 'faculty')
ORDER BY up.role, g.type, g.name;
