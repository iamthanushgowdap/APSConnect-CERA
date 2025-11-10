-- Check if the specific record exists in your current Supabase project
SELECT * FROM student_fundraising_status
WHERE campaign_id = '6e21067f-a89c-4efc-8aa1-b1fd3f640748'
AND student_uid = '04012805-3cea-4522-a6f3-2edb4b6487a8';

-- Check total records in the table
SELECT COUNT(*) as total_records FROM student_fundraising_status;

-- Check if the student profile exists
SELECT * FROM user_profiles WHERE id = '04012805-3cea-4522-a6f3-2edb4b6487a8';

-- Check if the campaign exists and who created it
SELECT id, title, created_by_uid FROM fundraising_campaigns WHERE id = '6e21067f-a89c-4efc-8aa1-b1fd3f640748';

-- TEST RLS: Check if the faculty user can access the data
-- This simulates what happens in the app
SELECT s.*
FROM student_fundraising_status s
INNER JOIN fundraising_campaigns c ON s.campaign_id = c.id
WHERE c.created_by_uid = 'ac221ff3-3695-4690-a56a-6cd2c0ccafbd'
AND s.campaign_id = '6e21067f-a89c-4efc-8aa1-b1fd3f640748';
