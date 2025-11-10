-- Manual assignment for testing - assign faculty/admin to groups
-- Replace 'faculty-user-id-here' with actual faculty user ID from debug query

-- First, let's see what groups exist
SELECT id, name, type, branch FROM public.groups ORDER BY type, name;

-- Then manually assign a faculty user to some groups (replace USER_ID_HERE)
-- INSERT INTO public.group_members (group_id, user_id, role, can_post)
-- SELECT 'official_announcements', 'USER_ID_HERE', 'faculty', true
-- ON CONFLICT (group_id, user_id) DO NOTHING;

-- INSERT INTO public.group_members (group_id, user_id, role, can_post)
-- SELECT 'faculty_lounge', 'USER_ID_HERE', 'faculty', true
-- ON CONFLICT (group_id, user_id) DO NOTHING;

-- If they have branch info, assign to department groups
-- INSERT INTO public.group_members (group_id, user_id, role, can_post)
-- SELECT branch || '_official', id, role, true
-- FROM public.user_profiles
-- WHERE role IN ('admin', 'faculty') AND branch IS NOT NULL
-- ON CONFLICT (group_id, user_id) DO NOTHING;
