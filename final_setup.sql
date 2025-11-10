-- 🚀 FINAL JOB BOARD SETUP SCRIPT
-- Run these SQL commands in order in your Supabase SQL Editor

-- STEP 1: Check if you have the correct alumni user
SELECT id, full_name, email, role FROM user_profiles WHERE role = 'alumni';

-- STEP 2: Run the corrected jobs schema (includes application instructions)
-- Copy and paste the entire content from fixed_job_schema.sql

-- STEP 3: Insert branches (your actual branch abbreviations)
INSERT INTO public.branches (name) VALUES
('CSE'), ('EC'), ('EEE'), ('ISE'), ('ME');

-- STEP 4: Insert sample jobs with application instructions
-- Replace '55df469a-ec41-402d-968f-94ea2dc2c2bc' with your actual alumni UUID
INSERT INTO public.jobs (
  title, company, description, requirements, responsibilities, location,
  job_type, experience_level, salary_min, salary_max, salary_currency,
  application_deadline, contact_email, contact_phone, website_url,
  eligible_branches, eligible_semesters, minimum_cgpa,
  required_skills, preferred_skills,
  application_instructions, application_url, application_email,
  posted_by_id, posted_by_name, posted_by_email
) VALUES (
  'Software Engineer',
  'Google',
  'We are looking for a passionate Software Engineer...',
  '3+ years of experience in software development...',
  'Design and develop scalable software solutions...',
  'Bangalore, Karnataka',
  'full-time', 'mid', 800000, 1500000, 'INR',
  '2024-12-31',
  'careers@google.com', '+91-9876543210', 'https://careers.google.com',
  ARRAY['CSE', 'ISE'], ARRAY['6th Semester', '7th Semester', '8th Semester'], 7.5,
  ARRAY['Java', 'Python', 'Algorithms', 'Data Structures'],
  ARRAY['Kubernetes', 'AWS', 'Machine Learning'],
  'Send your resume and cover letter to careers@google.com with subject "Software Engineer Application"',
  'https://careers.google.com/software-engineer',
  'careers@google.com',
  '55df469a-ec41-402d-968f-94ea2dc2c2bc', 'Rajesh Kumar', 'rajesh.kumar@google.com'
);

-- STEP 5: Verify setup
SELECT 'Jobs:' as check, COUNT(*) as count FROM jobs
UNION ALL
SELECT 'Branches:' as check, COUNT(*) as count FROM branches;
