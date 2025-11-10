-- Updated group assignment SQL that handles assigned_branches and assigned_semesters arrays
-- Run this to properly assign faculty/admin users based on their assigned branches/semesters

-- Assign faculty to faculty lounge (faculty don't need approval)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  'faculty_lounge' as group_id,
  id as user_id,
  role,
  true as can_post
FROM public.user_profiles
WHERE role = 'faculty'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign admins to admin announcements (admins don't need approval)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  'admin_announcements' as group_id,
  id as user_id,
  role,
  true as can_post
FROM public.user_profiles
WHERE role = 'admin'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign users to their department groups (faculty/admin don't need approval)
-- Handle both single branch and assigned_branches array
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT DISTINCT
  dept_group.group_id,
  up.id as user_id,
  up.role,
  CASE WHEN up.role IN ('admin', 'faculty') THEN true ELSE false END as can_post
FROM public.user_profiles up
CROSS JOIN (
  SELECT DISTINCT branch || '_official' as group_id, branch
  FROM public.groups
  WHERE type = 'official' AND id LIKE '%department%'
) dept_group
WHERE (up.is_approved = true OR up.role IN ('admin', 'faculty'))
  AND (
    -- Match single branch
    (up.branch IS NOT NULL AND dept_group.branch = up.branch)
    OR
    -- Match assigned_branches array
    (up.assigned_branches IS NOT NULL AND dept_group.branch = ANY(up.assigned_branches))
  )
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign faculty and admin to ALL class groups in their branch (don't need approval)
-- Handle both single branch/semester and assigned_branches/assigned_semesters arrays
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  g.id as group_id,
  up.id as user_id,
  up.role,
  true as can_post
FROM public.user_profiles up
CROSS JOIN public.groups g
WHERE up.role IN ('admin', 'faculty')
  AND g.type = 'official'
  AND g.id LIKE '%_official'
  AND g.id NOT LIKE '%department%'
  AND (
    -- Match single branch/semester
    (up.branch IS NOT NULL AND g.branch = up.branch)
    OR
    -- Match assigned_branches array
    (up.assigned_branches IS NOT NULL AND g.branch = ANY(up.assigned_branches))
  )
ON CONFLICT (group_id, user_id) DO NOTHING;
