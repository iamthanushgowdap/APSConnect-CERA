-- Script to populate groups and assign members based on existing user data
-- Run this after creating the groups tables

-- Insert default groups (use UPSERT to handle existing records)
INSERT INTO public.groups (id, name, type, branch, semester, description) VALUES
('official_announcements', 'Official Announcements', 'official', 'ALL', 'ALL', 'Important announcements from faculty and administration'),
('faculty_lounge', 'Faculty Lounge', 'official', 'ALL', 'ALL', 'Professional discussions and announcements for faculty members'),
('admin_announcements', 'Admin Announcements', 'official', 'ALL', 'ALL', 'Administrative announcements and system updates')
ON CONFLICT (id) DO NOTHING;

-- Insert department-specific groups for existing branches
INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_official' as id,
  branch || ' Department' as name,
  'official' as type,
  branch,
  'ALL' as semester,
  'Official communication for ' || branch || ' department.' as description
FROM (
  SELECT DISTINCT branch
  FROM public.user_profiles
  WHERE branch IS NOT NULL AND branch != ''
) branches
ON CONFLICT (id) DO NOTHING;

-- Insert class-specific groups for existing branch/semester combinations
INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_' || REPLACE(REPLACE(semester, ' & ', '-'), ' ', '-') || '_official' as id,
  branch || ' - ' || semester as name,
  'official' as type,
  branch,
  semester,
  'Class-specific announcements for ' || branch || ' ' || semester || '.' as description
FROM (
  SELECT DISTINCT branch, semester
  FROM public.user_profiles
  WHERE branch IS NOT NULL AND semester IS NOT NULL
    AND branch != '' AND semester != ''
    AND role IN ('student', 'faculty')
) class_groups
ON CONFLICT (id) DO NOTHING;

-- Insert student peer groups
INSERT INTO public.groups (id, name, type, branch, semester, description)
SELECT
  branch || '_' || REPLACE(REPLACE(semester, ' & ', '-'), ' ', '-') || '_student' as id,
  branch || ' ' || semester || ' Students' as name,
  'student' as type,
  branch,
  semester,
  'Peer discussion group for ' || branch || ' ' || semester || ' students.' as description
FROM (
  SELECT DISTINCT branch, semester
  FROM public.user_profiles
  WHERE branch IS NOT NULL AND semester IS NOT NULL
    AND branch != '' AND semester != ''
    AND role = 'student'
) student_groups
ON CONFLICT (id) DO NOTHING;

-- Assign all approved users to official announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  'official_announcements' as group_id,
  id as user_id,
  role,
  CASE WHEN role IN ('admin', 'faculty') THEN true ELSE false END as can_post
FROM public.user_profiles
WHERE is_approved = true
ON CONFLICT (group_id, user_id) DO NOTHING;

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
  SELECT DISTINCT id as group_id, branch
  FROM public.groups
  WHERE type = 'official' AND semester = 'ALL'
) dept_group
WHERE (up.is_approved = true OR up.role IN ('admin', 'faculty'))
  AND (
    -- Match single branch
    (up.branch IS NOT NULL AND dept_group.branch = up.branch)
    OR
    -- Faculty match assigned_branches array
    (up.role = 'faculty' AND up.assigned_branches IS NOT NULL AND dept_group.branch = ANY(up.assigned_branches))
    OR
    -- Admin gets department groups for all branches in the database
    (up.role = 'admin' AND dept_group.branch IN (
      SELECT name FROM public.branches
    ))
  )
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign faculty and admin to class groups in their assigned branches (or all for admin)
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
    -- Faculty get class groups from their assigned branches only
    (up.role = 'faculty' AND up.assigned_branches IS NOT NULL AND g.branch = ANY(up.assigned_branches))
    OR
    -- Admin gets class groups from all branches in the database
    (up.role = 'admin' AND g.branch IN (
      SELECT name FROM public.branches
    ))
  )
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign students to their specific class group
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  up.branch || '_' || REPLACE(REPLACE(up.semester, ' & ', '-'), ' ', '-') || '_official' as group_id,
  up.id as user_id,
  up.role,
  false as can_post
FROM public.user_profiles up
WHERE up.role = 'student'
  AND up.is_approved = true
  AND up.branch IS NOT NULL
  AND up.semester IS NOT NULL
  AND up.branch != ''
  AND up.semester != ''
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Assign students to their peer groups
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT
  up.branch || '_' || REPLACE(REPLACE(up.semester, ' & ', '-'), ' ', '-') || '_student' as group_id,
  up.id as user_id,
  up.role,
  true as can_post
FROM public.user_profiles up
WHERE up.branch IS NOT NULL AND up.semester IS NOT NULL
  AND up.branch != '' AND up.semester != ''
  AND up.role = 'student' AND up.is_approved = true
ON CONFLICT (group_id, user_id) DO NOTHING;
