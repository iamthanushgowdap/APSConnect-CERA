-- FIXED SCHEMA: UUID types for foreign keys
-- Run this to recreate the tables with proper UUID types

-- Drop existing tables if they exist (be careful with this in production!)
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Create jobs table for alumni job postings
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
  application_instructions TEXT, -- How to apply (e.g., "Send resume to email" or "Apply via company website")
  application_url TEXT, -- Direct link to apply online
  application_email TEXT, -- Contact email for applications

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
CREATE INDEX IF NOT EXISTS idx_jobs_eligible_branches ON public.jobs USING GIN (eligible_branches);
CREATE INDEX IF NOT EXISTS idx_jobs_eligible_semesters ON public.jobs USING GIN (eligible_semesters);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by_id ON public.jobs (posted_by_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON public.jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policies for jobs table
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
