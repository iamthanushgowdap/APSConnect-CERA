-- Direct assignment - assign admin to ALL existing official groups
-- Replace 'ADMIN_USER_ID_HERE' with actual admin user ID

-- First, find your admin user ID:
-- SELECT id, email FROM public.user_profiles WHERE role = 'admin';

-- Then replace ADMIN_USER_ID_HERE in the query below and run it:

INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, 'ADMIN_USER_ID_HERE', 'admin', true
FROM public.groups g
WHERE g.type = 'official'
ON CONFLICT (group_id, user_id) DO NOTHING;

-- Do the same for faculty - assign faculty to their assigned branches
-- Replace FACULTY_USER_ID_HERE with actual faculty user ID:

INSERT INTO public.group_members (group_id, user_id, role, can_post)
SELECT g.id, 'FACULTY_USER_ID_HERE', 'faculty', true
FROM public.groups g
WHERE g.type = 'official'
  AND g.branch IN ('CSE', 'ISE')  -- Use faculty's assigned_branches
ON CONFLICT (group_id, user_id) DO NOTHING;
