-- Query to find alumni users in your system
-- Run this first to get the alumni UUIDs for the sample data
SELECT id, full_name, email, role
FROM user_profiles
WHERE role = 'alumni'
ORDER BY full_name;
