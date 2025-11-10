-- Debug: Check what profiles exist and what the current user is
SELECT 'Current user info:' as debug;
SELECT id, email, role, branch, semester, assigned_branches, assigned_semesters
FROM public.user_profiles
WHERE email = 'chocolatethanush@gmail.com'; -- Replace with your admin email

SELECT 'All profiles count:' as debug;
SELECT role, COUNT(*) as count
FROM public.user_profiles
GROUP BY role;

SELECT 'Sample profiles:' as debug;
SELECT email, role, full_name, branch, semester
FROM public.user_profiles
ORDER BY role, email
LIMIT 10;
