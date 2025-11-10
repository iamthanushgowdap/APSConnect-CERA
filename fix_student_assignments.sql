-- Fix student group assignments - students use branch/semester from profile, not assigned_branches

-- Clear existing student assignments
DELETE FROM public.group_members
WHERE user_id IN (
  SELECT id FROM public.user_profiles WHERE role = 'student'
);

-- 1. Students get official announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'official_announcements', id, role, false
FROM public.user_profiles
WHERE role = 'student' AND is_approved = true
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 2. Students get their department group (based on their branch)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, false
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester = 'ALL' AND g.branch != 'ALL'
  AND up.role = 'student' AND up.is_approved = true
  AND up.branch IS NOT NULL AND g.branch = up.branch
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 3. Students get their specific class group (based on branch and semester)
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, false
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester != 'ALL'
  AND up.role = 'student' AND up.is_approved = true
  AND up.branch IS NOT NULL AND up.semester IS NOT NULL
  AND g.branch = up.branch AND g.semester = up.semester
ON CONFLICT (group_id, user_id) DO NOTHING;
