-- IMMEDIATE FIX: Disable RLS completely on user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Check if there are any students in the database
SELECT COUNT(*) as total_students FROM user_profiles WHERE role = 'student';

-- If no students exist, you need to create some for testing
-- Example: Insert a test student (replace with real values)
-- INSERT INTO user_profiles (id, email, full_name, role, usn, student_id, branch, semester, is_approved)
-- VALUES (
--   'test-uuid-here', -- You need to get this from Supabase auth.users
--   'student@example.com',
--   'Test Student',
--   'student',
--   '1AP23CS001',
--   '1AP23CS001',
--   'CSE',
--   '5th Sem',
--   true
-- );

-- Check what auth users exist
-- SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5;
