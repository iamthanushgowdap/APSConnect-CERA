-- Comprehensive debug - let's see exactly what's happening

-- 1. Check ALL groups in database
SELECT COUNT(*) as total_groups FROM public.groups;
SELECT type, COUNT(*) as count_by_type FROM public.groups GROUP BY type;

-- 2. Check official groups by branch
SELECT branch, semester, COUNT(*) as count
FROM public.groups
WHERE type = 'official'
GROUP BY branch, semester
ORDER BY branch, semester;

-- 3. Check what faculty have assigned_branches
SELECT email, role, assigned_branches
FROM public.user_profiles
WHERE role IN ('admin', 'faculty');

-- 4. Check the assignment logic manually for one admin
SELECT 'Checking admin assignments...' as status;
SELECT
  up.email,
  COUNT(gm.group_id) as assigned_groups,
  STRING_AGG(g.name, ', ') as group_names
FROM public.user_profiles up
LEFT JOIN public.group_members gm ON up.id = gm.user_id
LEFT JOIN public.groups g ON gm.group_id = g.id
WHERE up.email = 'admin@gmail.com'
GROUP BY up.id, up.email;

-- 5. Check if the assignment queries would work
SELECT 'Testing admin assignment logic...' as test;
SELECT COUNT(*) as admin_dept_groups_should_assign
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester = 'ALL' AND up.role = 'admin';

SELECT COUNT(*) as admin_class_groups_should_assign
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester != 'ALL' AND up.role = 'admin';
