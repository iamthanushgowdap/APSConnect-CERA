-- QUICK FIX: Complete working jobs table schema
-- Copy and paste this entire block into your Supabase SQL Editor

-- Drop existing table
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create jobs table
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
  eligible_branches TEXT[] NOT NULL DEFAULT '{}',
  eligible_semesters TEXT[] NOT NULL DEFAULT '{}',
  minimum_cgpa DECIMAL(3,2),
  required_skills TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  application_instructions TEXT,
  application_url TEXT,
  application_email TEXT,
  posted_by_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  posted_by_name TEXT NOT NULL,
  posted_by_email TEXT NOT NULL,
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
