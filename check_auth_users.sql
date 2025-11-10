-- Check what users exist in Supabase auth
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- For each user, check if they have a profile
-- SELECT up.id, up.email, up.full_name, up.role, up.usn, up.is_approved
-- FROM user_profiles up
-- WHERE up.id IN (SELECT id FROM auth.users);

-- If a user exists in auth but not in user_profiles, they need a profile
