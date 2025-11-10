-- CREATE PROPER ADMIN ACCOUNT SCRIPT
-- This script creates a proper admin account with both auth and profile

-- Step 1: First, let's check if the admin profile exists
SELECT id, email, full_name, role, is_approved
FROM public.user_profiles
WHERE email = 'admin@gmail.com';

-- Step 2: If the profile exists but has wrong ID, delete it and recreate properly
-- (We'll use the faculty creation process which creates both auth and profile)

-- Step 3: Create admin account using faculty creation process
-- This will create both Supabase auth account and user profile
-- Use the faculty creation UI at /admin/users -> "Manage Faculty" -> "Add New Faculty"
-- Then promote to admin with:

UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@gmail.com' AND role = 'faculty';

-- Step 4: Verify admin account
SELECT id, email, full_name, role, is_approved, created_at
FROM public.user_profiles
WHERE role = 'admin';

-- ALTERNATIVE: If you want to manually fix the existing profile
-- Update the existing admin profile to have proper structure

UPDATE public.user_profiles
SET
  status = NULL, -- Remove 'pending' status
  role = 'admin',
  is_approved = true,
  updated_at = NOW()
WHERE email = 'admin@gmail.com';

-- But this still won't create the auth account!
-- You need to create the Supabase auth account first
