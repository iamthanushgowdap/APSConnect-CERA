-- Check if there are any profiles in the table
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- Check what IDs exist in the table
SELECT id, email, role FROM user_profiles LIMIT 5;

-- Check if the failing user ID exists
SELECT id, email, role FROM user_profiles
WHERE id = 'f0c749e1-978b-49c0-911a-98895dd2f676'; -- Replace with the failing user ID

-- Check if any profiles exist with similar IDs (first 8 chars)
SELECT id, email, role FROM user_profiles
WHERE id LIKE 'f0c749e1%';

-- Check the auth.users table to see what user IDs exist
-- Note: This requires admin privileges, you might not be able to run this
