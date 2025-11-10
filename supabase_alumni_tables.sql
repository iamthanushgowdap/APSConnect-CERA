-- Supabase Tables for Alumni Portal

-- Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    salary_range TEXT,
    job_type TEXT DEFAULT 'Full-time',
    description TEXT NOT NULL,
    required_skills TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    posted_by TEXT NOT NULL,
    contact_email TEXT,
    application_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentorship Requests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentee_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mentor_id TEXT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to user_profiles for alumni career information
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_position') THEN
        ALTER TABLE user_profiles ADD COLUMN current_position TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_company') THEN
        ALTER TABLE user_profiles ADD COLUMN current_company TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'graduation_year') THEN
        ALTER TABLE user_profiles ADD COLUMN graduation_year INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'location') THEN
        ALTER TABLE user_profiles ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'linkedin_url') THEN
        ALTER TABLE user_profiles ADD COLUMN linkedin_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'skills') THEN
        ALTER TABLE user_profiles ADD COLUMN skills TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'achievements') THEN
        ALTER TABLE user_profiles ADD COLUMN achievements TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_featured ON job_postings(is_featured);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentee ON mentorship_requests(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- Insert sample alumni data
INSERT INTO user_profiles (
    id, full_name, email, role, branch, semester, graduation_year,
    current_position, current_company, location, skills, is_available_for_mentoring
) VALUES
('alumni-001', 'Sarah Johnson', 'sarah.johnson@alumni.edu', 'alumni', 'CSE', '8th Sem', 2023,
    'Senior Software Engineer', 'Google', 'Bangalore, Karnataka',
    ARRAY['React', 'Node.js', 'Python', 'Machine Learning'], true),
('alumni-002', 'Michael Chen', 'michael.chen@alumni.edu', 'alumni', 'ECE', '8th Sem', 2022,
    'Product Manager', 'Microsoft', 'Hyderabad, Telangana',
    ARRAY['Product Strategy', 'Agile', 'Analytics'], true),
('alumni-003', 'Priya Sharma', 'priya.sharma@alumni.edu', 'alumni', 'CSE', '8th Sem', 2023,
    'Data Scientist', 'Amazon', 'Chennai, Tamil Nadu',
    ARRAY['Python', 'SQL', 'AWS', 'Machine Learning'], false),
('alumni-004', 'Rahul Verma', 'rahul.verma@alumni.edu', 'alumni', 'ME', '8th Sem', 2021,
    'DevOps Engineer', 'Netflix', 'Mumbai, Maharashtra',
    ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD'], true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Policies for job_postings (read access for alumni)
CREATE POLICY "Alumni can view job postings" ON job_postings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()::text AND role = 'alumni'
        )
    );

-- Policies for mentorship_requests
CREATE POLICY "Users can view their own mentorship requests" ON mentorship_requests
    FOR SELECT USING (
        mentee_id = auth.uid()::text OR mentor_id = auth.uid()::text
    );

CREATE POLICY "Students can create mentorship requests" ON mentorship_requests
    FOR INSERT WITH CHECK (
        mentee_id = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()::text AND role = 'student'
        )
    );

CREATE POLICY "Alumni can update mentorship requests they're mentoring" ON mentorship_requests
    FOR UPDATE USING (
        mentor_id = auth.uid()::text AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()::text AND role = 'alumni'
        )
    );
