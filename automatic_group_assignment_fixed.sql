-- Automatic group assignment - FIXED VERSION with proper conflict handling

-- Clear existing assignments for admin/faculty
DELETE FROM public.group_members
WHERE user_id IN (
  SELECT id FROM public.user_profiles WHERE role IN ('admin', 'faculty')
);

-- Wait for delete to complete (add this if needed)
-- SELECT pg_sleep(1);

-- 1. All admin/faculty get official announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'official_announcements', id, role,
       CASE WHEN role IN ('admin', 'faculty') THEN true ELSE false END
FROM public.user_profiles WHERE role IN ('admin', 'faculty')
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 2. Faculty get faculty lounge
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'faculty_lounge', id, role, true
FROM public.user_profiles WHERE role = 'faculty'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 3. Admins get admin announcements
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT 'admin_announcements', id, role, true
FROM public.user_profiles WHERE role = 'admin'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 4. ADMINS GET ALL DEPARTMENT GROUPS (semester = 'ALL')
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, true
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester = 'ALL' AND up.role = 'admin'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 5. ADMINS GET ALL CLASS GROUPS (semester != 'ALL')
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, true
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester != 'ALL' AND up.role = 'admin'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 6. FACULTY GET DEPARTMENT GROUPS FOR THEIR assigned_branches
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, true
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester = 'ALL'
  AND up.role = 'faculty'
  AND up.assigned_branches IS NOT NULL
  AND g.branch = ANY(up.assigned_branches)
ON CONFLICT (group_id, user_id) DO NOTHING;

-- 7. FACULTY GET CLASS GROUPS FOR THEIR assigned_branches
INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, up.id, up.role, true
FROM public.groups g, public.user_profiles up
WHERE g.type = 'official' AND g.semester != 'ALL'
  AND up.role = 'faculty'
  AND up.assigned_branches IS NOT NULL
  AND g.branch = ANY(up.assigned_branches)
ON CONFLICT (group_id, user_id) DO NOTHING;
