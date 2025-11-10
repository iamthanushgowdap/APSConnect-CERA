-- 🎯 COMPLETE JOB BOARD SETUP SCRIPT
-- Run these commands in order in your Supabase SQL Editor

-- STEP 1: Find your alumni users
SELECT id, full_name, email, role
FROM user_profiles
WHERE role = 'alumni'
ORDER BY full_name;

-- STEP 2: Drop existing tables (if they exist with wrong types)
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- STEP 3: Create the corrected tables with TEXT foreign keys
-- (Copy the entire fixed_job_schema.sql content here and run it)

-- STEP 4: Insert branches data (using your actual branch abbreviations)
INSERT INTO public.branches (name) VALUES
('CSE'),
('EC'),
('EEE'),
('ISE'),
('ME');

-- STEP 5: Insert sample jobs (using the provided alumni UUID: 55df469a-ec41-402d-968f-94ea2dc2c2bc)
-- Copy from sample_jobs_data.sql and replace the alumni UUIDs

-- STEP 6: Verify setup
SELECT 'Jobs table:' as check, COUNT(*) as count FROM jobs
UNION ALL
SELECT 'Job applications table:' as check, COUNT(*) as count FROM job_applications
UNION ALL
SELECT 'Branches table:' as check, COUNT(*) as count FROM branches;
