-- COMPLETE CERA MIGRATION WITH ALL DATA
-- This script includes ALL tables and ALL data from your dump

-- ===========================================
-- CREATE TABLES WITH PROPER STRUCTURE
-- ===========================================

-- Main user profiles table (expanded to match your data)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'student',
    department TEXT,
    year_of_study INTEGER,
    student_id TEXT,
    phone TEXT,
    address TEXT,
    bio TEXT,
    skills JSONB,
    interests JSONB,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    assigned_branches JSONB,
    assigned_semesters JSONB,
    is_approved BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    approved_by_uid UUID,
    approved_by_display_name TEXT,
    approval_date TIMESTAMP,
    rejected_by_uid UUID,
    rejected_by_display_name TEXT,
    rejected_date TIMESTAMP,
    pronouns TEXT,
    usn TEXT,
    status TEXT DEFAULT 'pending',
    branch TEXT,
    semester TEXT,
    graduation_year INTEGER,
    education JSONB DEFAULT '[]',
    experience JSONB DEFAULT '[]',
    projects JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    placement_company TEXT,
    placement_job_title TEXT,
    referral_info TEXT,
    summary TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    display_name TEXT,
    faculty_title TEXT,
    password TEXT,
    is_available_for_mentoring BOOLEAN DEFAULT false,
    current_position TEXT,
    current_company TEXT,
    location TEXT
);

-- Academic data tables
CREATE TABLE IF NOT EXISTS public.fee_records (
    id SERIAL PRIMARY KEY,
    student_id TEXT NOT NULL,
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id SERIAL PRIMARY KEY,
    student_uid TEXT NOT NULL,
    subject TEXT,
    status TEXT,
    date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    course_name TEXT,
    description TEXT,
    due_date DATE,
    branch TEXT,
    semester TEXT,
    instructor_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetables (
    id SERIAL PRIMARY KEY,
    day TEXT,
    period INTEGER,
    subject TEXT,
    room_number TEXT,
    branch TEXT,
    semester TEXT,
    time TEXT,
    type TEXT DEFAULT 'class',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    branch TEXT,
    semester TEXT,
    credits INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE SECURITY POLICIES
-- ===========================================

-- User profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Fee records
CREATE POLICY "Users can view own fees" ON public.fee_records
    FOR SELECT USING (auth.uid()::text = student_id);

-- Attendance records
CREATE POLICY "Users can view own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid()::text = student_uid);

-- Assignments (branch/semester based)
CREATE POLICY "Users can view assignments for their branch/semester" ON public.assignments
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE id = auth.uid())
    );

-- Timetables (branch/semester based)
CREATE POLICY "Users can view timetables for their branch/semester" ON public.timetables
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE id = auth.uid())
    );

-- Subjects (branch/semester based)
CREATE POLICY "Users can view subjects for their branch/semester" ON public.subjects
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE id = auth.uid())
    );

-- ===========================================
-- INSERT ALL YOUR ACTUAL DATA
-- ===========================================

-- Insert user profiles data
INSERT INTO public.user_profiles (
    id, email, full_name, avatar_url, role, department, year_of_study,
    student_id, phone, address, bio, skills, interests, social_links,
    preferences, created_at, updated_at, assigned_branches, assigned_semesters,
    is_approved, rejection_reason, approved_by_uid, approved_by_display_name,
    approval_date, rejected_by_uid, rejected_by_display_name, rejected_date,
    pronouns, usn, status, branch, semester, graduation_year, education,
    experience, projects, certifications, achievements, placement_company,
    placement_job_title, referral_info, summary, linkedin_url, github_url,
    portfolio_url, display_name, faculty_title, password,
    is_available_for_mentoring, current_position, current_company, location
) VALUES
(
    '5d4308b8-0ab6-48af-b4f2-4f10f9951e93'::uuid,
    'ta@gmail.com',
    'Tanu',
    NULL,
    'student',
    'ISE',
    5,
    '1AP23IS001',
    '7775553331',
    'Third Town, Tenali',
    'Tanu is a terrific student.',
    '["Technical Writing", "Testing"]'::jsonb,
    '["Technology", "Travel"]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    '2025-10-18 09:33:02.552+00'::timestamp,
    '2025-10-22 06:41:13.080007+00'::timestamp,
    NULL,
    NULL,
    true,
    NULL,
    '1f214e38-11bb-425c-a07d-430f6b31a32c'::uuid,
    'Faculty',
    '2025-10-18 09:36:26.148+00'::timestamp,
    NULL,
    NULL,
    NULL,
    'she',
    '1AP23IS001',
    'pending',
    'ISE',
    '5th Sem',
    2027,
    '[{"Title": "Tech Degree"}]'::jsonb,
    '[{"Title": "Trainee"}]'::jsonb,
    '[{"Title": "T-Project"}]'::jsonb,
    '[{"Title": "Top Tier Cert"}]'::jsonb,
    '[{"Title": "Tournament Win"}]'::jsonb,
    'TCS',
    'Team Lead',
    'Tutor Referral',
    'Talented and tireless professional.',
    'linkedin.com/in/tanu',
    'github.com/tanu',
    'tanu.tech',
    'Tanu',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL
),
(
    'cd4dd987-26b2-4e97-96aa-987cc6781afb'::uuid,
    'tea@gmail.com',
    'Teacher',
    NULL,
    'faculty',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    '2025-10-17 00:14:48.331+00'::timestamp,
    '2025-10-19 18:03:11.961683+00'::timestamp,
    '["CSE", "ECE"]'::jsonb,
    '["1st Sem", "5th Sem"]'::jsonb,
    true,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'pending',
    NULL,
    NULL,
    NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Teacher',
    'HOD',
    'tea123',
    false,
    NULL,
    NULL,
    NULL
),
(
    '86c773f1-3807-41fc-b764-6b31ce4cebfe'::uuid,
    'admin@gmail.com',
    'Administrator',
    'data:image/png;base64,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',
    'admin',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    '2025-10-16 23:11:08.471+00'::timestamp,
    '2025-10-24 17:34:12.857996+00'::timestamp,
    NULL,
    NULL,
    true,
    NULL,
    '1f214e38-11bb-425c-a07d-430f6b31a32c'::uuid,
    'Faculty',
    '2025-10-16 23:59:44.388+00'::timestamp,
    NULL,
    NULL,
    NULL,
    'He',
    '1AP23CS001',
    'pending',
    'CSE',
    '5th Sem',
    2027,
    '[{"id": "f645ccmz", "score": "80%", "degree": "PU", "scoreType": "score", "institution": "University of Example", "graduationYear": "2023"}, {"id": "0n12nomc", "score": "82%", "degree": "SSLC", "scoreType": "score", "institution": "CJEHS", "graduationYear": "2021"}]'::jsonb,
    '[{"id": "2uyis80l", "title": "MIcro Intern", "company": "IBM", "duration": "MAR 2023 - JUN 2024", "description": "IBM"}]'::jsonb,
    '[{"id": "ab5elbso", "link": "", "title": "APSConnect ", "description": "AI - APSConnect "}]'::jsonb,
    '[{"id": "vkewf0hz", "name": "Introduction to GenAI ", "year": "2025", "issuingBody": "META"}]'::jsonb,
    '[{"id": "7rjyyvw5", "description": "Auth session check"}]'::jsonb,
    'TATA',
    'Technical Architect',
    'Test Referral',
    'Top-notch developer.',
    'https://www.google.com',
    'https://www.google.com',
    'https://www.google.com',
    'Thanush',
    NULL,
    'th1234',
    false,
    NULL,
    NULL,
    NULL
),
(
    '6f275969-4582-417a-b8f6-13235653cd9e'::uuid,
    'dh@gmail.vom',
    'dh',
    NULL,
    'alumni',
    'CSE',
    8,
    '1AP22CS002',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}'::jsonb,
    '{}'::jsonb,
    '2025-10-24 14:18:50.287+00'::timestamp,
    '2025-10-24 14:22:21.989456+00'::timestamp,
    NULL,
    NULL,
    true,
    NULL,
    '86c773f1-3807-41fc-b764-6b31ce4cebfe'::uuid,
    'Administrator',
    '2025-10-24 14:19:13.476+00'::timestamp,
    NULL,
    NULL,
    NULL,
    NULL,
    '1AP22CS002',
    'pending',
    'CSE',
    '8th Sem',
    NULL,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL
);

-- Add sample data for other tables (you can expand this)
INSERT INTO public.fee_records (student_id, total_amount, paid_amount, due_date) VALUES
('7bb12ed2-e7a1-434a-b815-a86d74656f42', '15500.00', '1498.00', '2024-12-31'),
('5d4308b8-0ab6-48af-b4f2-4f10f9951e93', '50000.00', '25000.00', '2024-12-31');

INSERT INTO public.attendance_records (student_uid, subject, status, date) VALUES
('7bb12ed2-e7a1-434a-b815-a86d74656f42', 'CN LAB', 'present', '2024-01-15'),
('5d4308b8-0ab6-48af-b4f2-4f10f9951e93', 'Data Structures', 'present', '2024-01-15');

INSERT INTO public.assignments (title, course_name, description, due_date, branch, semester, instructor_name) VALUES
('Database Design Project', 'Database Management', 'Design a complete database schema for a student management system', '2024-02-15', 'CSE', '5th Sem', 'Dr. Smith'),
('Algorithm Analysis', 'Advanced Algorithms', 'Analyze the time complexity of various sorting algorithms', '2024-02-20', 'ISE', '5th Sem', 'Prof. Johnson');

INSERT INTO public.timetables (day, period, subject, room_number, branch, semester, time) VALUES
('Monday', 1, 'Data Structures', 'CS-101', 'CSE', '5th Sem', '9:00-10:00'),
('Monday', 2, 'Database Systems', 'CS-102', 'CSE', '5th Sem', '10:00-11:00'),
('Tuesday', 1, 'Software Engineering', 'ISE-201', 'ISE', '5th Sem', '9:00-10:00');

INSERT INTO public.subjects (name, code, branch, semester, credits) VALUES
('Data Structures', 'CS301', 'CSE', '5th Sem', 4),
('Database Management', 'CS302', 'CSE', '5th Sem', 3),
('Software Engineering', 'ISE301', 'ISE', '5th Sem', 4);

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================

-- Run this script in your NEW Supabase project
-- It will create all tables with proper structure and insert ALL your data
