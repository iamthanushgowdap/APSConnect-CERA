-- COMPLETE CERA DATABASE MIGRATION SCRIPT
-- This script migrates ALL tables and data from your original Supabase project
-- Run this in your NEW Supabase project SQL Editor

-- ===========================================
-- CREATE ALL CERA TABLES
-- ===========================================

-- Core user management
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT,
    branch TEXT,
    semester TEXT,
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

-- Academic data
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

-- Social features
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id),
    user_id UUID REFERENCES auth.users(id),
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.groups(id),
    user_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Study materials and resources
CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    subject TEXT,
    branch TEXT,
    semester TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Career and job features
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    location TEXT,
    posted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    mentor_id UUID REFERENCES auth.users(id),
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fundraising features
CREATE TABLE IF NOT EXISTS public.fundraising_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    deadline DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_fundraising_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id),
    campaign_id UUID REFERENCES public.fundraising_campaigns(id),
    amount_pledged DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Admin and system features
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID REFERENCES auth.users(id),
    reported_user UUID REFERENCES auth.users(id),
    report_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT,
    content TEXT,
    type TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Branches table
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fundraising_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- CREATE SECURITY POLICIES
-- ===========================================

-- User profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- User preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Fee records
CREATE POLICY "Users can view own fees" ON public.fee_records
    FOR SELECT USING (auth.uid()::text = student_id);

-- Attendance records
CREATE POLICY "Users can view own attendance" ON public.attendance_records
    FOR SELECT USING (auth.uid()::text = student_uid);

-- Assignments (branch/semester based)
CREATE POLICY "Users can view assignments for their branch/semester" ON public.assignments
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

-- Timetables (branch/semester based)
CREATE POLICY "Users can view timetables for their branch/semester" ON public.timetables
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

-- Subjects (branch/semester based)
CREATE POLICY "Users can view subjects for their branch/semester" ON public.subjects
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

-- Groups and messaging
CREATE POLICY "Users can view groups they are members of" ON public.groups
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.group_members
            WHERE group_id = groups.id
        )
    );

CREATE POLICY "Users can view group members for groups they are in" ON public.group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert group members for groups they created" ON public.group_members
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT id FROM public.groups WHERE created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view messages for groups they are in" ON public.group_messages
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for groups they are in" ON public.group_messages
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT group_id FROM public.group_members
            WHERE user_id = auth.uid()
        ) AND user_id = auth.uid()
    );

-- Direct messages
CREATE POLICY "Users can view their own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Study materials
CREATE POLICY "Users can view study materials for their branch/semester" ON public.study_materials
    FOR SELECT USING (
        branch = (SELECT branch FROM public.user_profiles WHERE user_id = auth.uid()) AND
        semester = (SELECT semester FROM public.user_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can upload study materials" ON public.study_materials
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Job postings (public)
CREATE POLICY "Anyone can view job postings" ON public.job_postings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create job postings" ON public.job_postings
    FOR INSERT WITH CHECK (auth.uid() = posted_by);

-- Mentorship
CREATE POLICY "Users can view their mentorship requests" ON public.mentorship_requests
    FOR SELECT USING (auth.uid() = student_id OR auth.uid() = mentor_id);

CREATE POLICY "Students can create mentorship requests" ON public.mentorship_requests
    FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Fundraising
CREATE POLICY "Anyone can view fundraising campaigns" ON public.fundraising_campaigns
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create fundraising campaigns" ON public.fundraising_campaigns
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their fundraising status" ON public.student_fundraising_status
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Users can update their fundraising status" ON public.student_fundraising_status
    FOR UPDATE USING (auth.uid() = student_id);

-- Admin settings (restrict to specific users)
CREATE POLICY "Only admins can view admin settings" ON public.admin_settings
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Site settings (public read)
CREATE POLICY "Anyone can view site settings" ON public.site_settings
    FOR SELECT TO authenticated USING (true);

-- Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Reports
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Drafts
CREATE POLICY "Users can view their own drafts" ON public.drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own drafts" ON public.drafts
    FOR ALL USING (auth.uid() = user_id);

-- Branches (public)
CREATE POLICY "Anyone can view branches" ON public.branches
    FOR SELECT TO authenticated USING (true);

-- ===========================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ===========================================

-- Update updated_at column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_fundraising_campaigns_updated_at
    BEFORE UPDATE ON public.fundraising_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON public.drafts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaign amount update function
CREATE OR REPLACE FUNCTION public.update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.fundraising_campaigns
    SET current_amount = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM public.student_fundraising_status
        WHERE campaign_id = COALESCE(NEW.campaign_id, OLD.campaign_id)
    )
    WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Campaign amount trigger
CREATE TRIGGER update_campaign_amount_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.student_fundraising_status
    FOR EACH ROW EXECUTE FUNCTION public.update_campaign_amount();

-- Comments count function (if posts table exists)
-- CREATE OR REPLACE FUNCTION public.update_post_likes_count()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
--         RETURN NEW;
--     ELSIF TG_OP = 'DELETE' THEN
--         UPDATE posts SET likes = likes - 1 WHERE id = OLD.post_id;
--         RETURN OLD;
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- ===========================================
-- MIGRATION COMPLETE - NOW COPY YOUR DATA
-- ===========================================

-- MANUAL STEP: Copy ALL INSERT statements from last_dump.sql
-- Search for and copy ALL lines starting with:
-- INSERT INTO public.user_profiles
-- INSERT INTO public.user_preferences
-- INSERT INTO public.fee_records
-- INSERT INTO public.attendance_records
-- INSERT INTO public.assignments
-- INSERT INTO public.timetables
-- INSERT INTO public.subjects
-- INSERT INTO public.groups
-- INSERT INTO public.group_members
-- INSERT INTO public.group_messages
-- INSERT INTO public.messages
-- INSERT INTO public.study_materials
-- INSERT INTO public.job_postings
-- INSERT INTO public.mentorship_requests
-- INSERT INTO public.fundraising_campaigns
-- INSERT INTO public.student_fundraising_status
-- INSERT INTO public.admin_settings
-- INSERT INTO public.site_settings
-- INSERT INTO public.notifications
-- INSERT INTO public.reports
-- INSERT INTO public.drafts
-- INSERT INTO public.branches
--
-- Paste ALL of them below this comment block
-- Then run the entire script in Supabase SQL Editor
