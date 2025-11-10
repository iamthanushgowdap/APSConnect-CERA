-- Automatic group assignment based on roles and assigned_branches
-- This will handle admin (all groups) and faculty (assigned branches only)

-- Clear existing assignments for admin/faculty to start fresh
DELETE FROM public.group_members
WHERE user_id IN (
  SELECT id FROM public.user_profiles WHERE role IN ('admin', 'faculty')
);

-- 1. All users get official announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'official_announcements', id, role,
       CASE WHEN role IN ('admin', 'faculty') THEN true ELSE false END
FROM public.user_profiles
WHERE role IN ('admin', 'faculty');

-- 2. Faculty get faculty lounge
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'faculty_lounge', id, 'faculty', true
FROM public.user_profiles
WHERE role = 'faculty';

-- 3. Admins get admin announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'admin_announcements', id, 'admin', true
FROM public.user_profiles
WHERE role = 'admin';

-- 4. Admins get ALL department groups (semester = 'ALL')
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, 'admin', true
FROM public.groups g
CROSS JOIN public.user_profiles up
WHERE g.type = 'official'
  AND g.semester = 'ALL'
  AND up.role = 'admin';

-- 5. Admins get ALL class groups (semester != 'ALL')
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, 'admin', true
FROM public.groups g
CROSS JOIN public.user_profiles up
WHERE g.type = 'official'
  AND g.semester != 'ALL'
  AND up.role = 'admin';

-- 6. Faculty get department groups for their assigned_branches
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, 'faculty', true
FROM public.groups g
CROSS JOIN public.user_profiles up
WHERE g.type = 'official'
  AND g.semester = 'ALL'
  AND up.role = 'faculty'
  AND up.assigned_branches IS NOT NULL
  AND g.branch = ANY(up.assigned_branches);

-- 7. Faculty get class groups for their assigned_branches
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, 'faculty', true
FROM public.groups g
CROSS JOIN public.user_profiles up
WHERE g.type = 'official'
  AND g.semester != 'ALL'
  AND up.role = 'faculty'
  AND up.assigned_branches IS NOT NULL
  AND g.branch = ANY(up.assigned_branches);
