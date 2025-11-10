-- CERA Data Migration Script
-- This script imports only your custom CERA tables and data
-- Run this in your NEW Supabase project SQL Editor

-- Create CERA tables (skip if they already exist)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    branch TEXT,
    semester TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light',
    voice_enabled BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies (students can only access their own data)
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own fees" ON public.fee_records
    FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Users can view own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid()::text = student_uid);

CREATE POLICY "Users can view assignments for their branch/semester" ON public.assignments
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view timetables for their branch/semester" ON public.timetables
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY 
