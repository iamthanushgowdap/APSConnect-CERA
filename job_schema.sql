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

  -- Posted by alumni
  posted_by_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  posted_by_name TEXT NOT NULL,
  posted_by_email TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
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

-- Create job_applications table to track applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Application details
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  linkedin_url TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected')),
  status_notes TEXT,

  -- Metadata
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES user_profiles(id),

  UNIQUE(job_id, student_id)
);

-- Create indexes for job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications (job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student_id ON public.job_applications (student_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications (status);

-- Create trigger for job applications
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Policies for jobs table
CREATE POLICY "Jobs are viewable by authenticated users" ON public.jobs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Alumni can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'alumni'
    )
  );

CREATE POLICY "Alumni can update their own jobs" ON public.jobs
  FOR UPDATE USING (
    posted_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for job_applications table
CREATE POLICY "Students can view their own applications" ON public.job_applications
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Alumni can view applications for their jobs" ON public.job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.posted_by_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Students can create applications" ON public.job_applications
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Alumni and admins can update applications" ON public.job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_applications.job_id
      AND jobs.posted_by_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
