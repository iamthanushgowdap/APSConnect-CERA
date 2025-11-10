-- Check if there are any student profiles in the database
SELECT COUNT(*) as total_students FROM user_profiles WHERE role = 'student';

-- Check what student profiles exist
SELECT id, email, usn, student_id, full_name, role, is_approved
FROM user_profiles
WHERE role = 'student'
LIMIT 5;

-- Check if the user_profiles table has RLS disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- If RLS is still enabled, disable it
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Test the student lookup query that's failing
SELECT email, usn, student_id
FROM user_profiles
WHERE role = 'student'
AND (usn = '1AP23CS001' OR student_id = '1AP23CS001')
LIMIT 1;
