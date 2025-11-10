-- 🚀 FINAL JOB BOARD SETUP SCRIPT (FIXED)
-- Run these SQL commands in order in your Supabase SQL Editor

-- STEP 1: Check if you have the correct alumni user
SELECT id, full_name, email, role FROM user_profiles WHERE role = 'alumni';

-- STEP 2: Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.jobs CASCADE;

-- STEP 3: Create the corrected jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  location TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract', 'freelance')),
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_currency TEXT DEFAULT 'INR',
  application_deadline DATE,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Eligibility criteria
  eligible_branches TEXT[] NOT NULL DEFAULT '{}',
  eligible_semesters TEXT[] NOT NULL DEFAULT '{}',
  minimum_cgpa DECIMAL(3,2),
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',

  -- Application instructions (for external applications)
  application_instructions TEXT,
  application_url TEXT,
  application_email TEXT,

  -- Posted by alumni (TEXT TYPE to match user_profiles.id)
  posted_by_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  posted_by_name TEXT NOT NULL,
  posted_by_email TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_eligible_branches ON public.jobs USING GIN (eligible_branches);
CREATE INDEX IF NOT EXISTS idx_jobs_eligible_semesters ON public.jobs USING GIN (eligible_semesters);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_id ON public.jobs (posted_by_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at DESC);

-- Create trigger
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Jobs are viewable by authenticated users" ON public.jobs
  FOR SELECT USING (auth.uid()::TEXT IS NOT NULL);

CREATE POLICY "Alumni can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid()::TEXT IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()::TEXT AND role = 'alumni'
    )
  );

CREATE POLICY "Alumni can update their own jobs" ON public.jobs
  FOR UPDATE USING (
    posted_by_id = auth.uid()::TEXT OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()::TEXT AND role = 'admin'
    )
  );

-- STEP 4: Insert branches
INSERT INTO public.branches (name) VALUES
('CSE'), ('EC'), ('EEE'), ('ISE'), ('ME');

-- STEP 5: Insert sample job (replace alumni UUID with yours)
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
  'We are looking for a passionate Software Engineer to join our team.',
  '3+ years experience, strong CS fundamentals',
  'Develop scalable solutions, collaborate with teams',
  'Bangalore, Karnataka',
  'full-time', 'mid', 800000, 1500000, 'INR',
  '2024-12-31',
  'careers@google.com', '+91-9876543210', 'https://careers.google.com',
  ARRAY['CSE', 'ISE'], ARRAY['6th Semester', '7th Semester', '8th Semester'], 7.5,
  ARRAY['Java', 'Python', 'Algorithms'],
  ARRAY['Kubernetes', 'AWS'],
  'Send resume to careers@google.com with subject "Software Engineer Application"',
  'https://careers.google.com/software-engineer',
  'careers@google.com',
  '55df469a-ec41-402d-968f-94ea2dc2c2bc', 'Rajesh Kumar', 'rajesh.kumar@google.com'
);

-- STEP 6: Verify setup
SELECT 'Jobs:' as check, COUNT(*) as count FROM jobs
UNION ALL
SELECT 'Branches:' as check, COUNT(*) as count FROM branches;
