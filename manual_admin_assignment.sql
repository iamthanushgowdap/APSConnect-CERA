-- Manual assignment for testing - assign a specific admin to all groups
-- Replace 'ADMIN_USER_ID_HERE' with actual admin user ID from debug query

-- First get all official groups
-- SELECT id, name, branch FROM public.groups WHERE type = 'official' ORDER BY branch, name;

-- Then manually assign admin to all groups (replace ADMIN_USER_ID_HERE)
-- Example:
-- INSERT INTO public.group_members (group_id, user_id, role, can_post)
-- VALUES
-- ('official_announcements', 'ADMIN_USER_ID_HERE', 'admin', true),
-- ('admin_announcements', 'ADMIN_USER_ID_HERE', 'admin', true),
-- ('CSE_official', 'ADMIN_USER_ID_HERE', 'admin', true),
-- ('EC_official', 'ADMIN_USER_ID_HERE', 'admin', true),
-- ('ISE_official', 'ADMIN_USER_ID_HERE', 'admin', true),
-- ('ME_official', 'ADMIN_USER_ID_HERE', 'admin', true)
-- ON CONFLICT (group_id, user_id) DO NOTHING;
