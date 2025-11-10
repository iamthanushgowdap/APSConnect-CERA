-- DATA EXTRACTION FROM CURRENT WORKING DATABASE
-- Run these queries in your CURRENT Supabase project to extract ALL data

-- ===========================================
-- STEP 1: Extract user_profiles
-- ===========================================

SELECT 'INSERT INTO public.user_profiles (id, user_id, full_name, branch, semester, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(full_name, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.user_profiles;

-- ===========================================
-- STEP 2: Extract user_preferences
-- ===========================================

SELECT 'INSERT INTO public.user_preferences (id, user_id, language, theme, voice_enabled, updated_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(language, 'en')) || ', ' ||
       quote_literal(COALESCE(theme, 'light')) || ', ' ||
       CASE WHEN voice_enabled THEN 'true' ELSE 'false' END || ', ' ||
       quote_literal(updated_at) || ');' as sql_statement
FROM public.user_preferences;

-- ===========================================
-- STEP 3: Extract fee_records
-- ===========================================

SELECT 'INSERT INTO public.fee_records (id, student_id, total_amount, paid_amount, due_date, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(student_id) || ', ' ||
       quote_literal(total_amount) || ', ' ||
       quote_literal(paid_amount) || ', ' ||
       CASE WHEN due_date IS NOT NULL THEN quote_literal(due_date) ELSE 'NULL' END || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.fee_records;

-- ===========================================
-- STEP 4: Extract attendance_records
-- ===========================================

SELECT 'INSERT INTO public.attendance_records (id, student_uid, subject, status, date, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(student_uid) || ', ' ||
       quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(status, '')) || ', ' ||
       CASE WHEN date IS NOT NULL THEN quote_literal(date) ELSE 'NULL' END || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.attendance_records;

-- ===========================================
-- STEP 5: Extract assignments
-- ===========================================

SELECT 'INSERT INTO public.assignments (id, title, course_name, description, due_date, branch, semester, instructor_name, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(course_name, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       CASE WHEN due_date IS NOT NULL THEN quote_literal(due_date) ELSE 'NULL' END || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(COALESCE(instructor_name, '')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.assignments;

-- ===========================================
-- STEP 6: Extract timetables
-- ===========================================

SELECT 'INSERT INTO public.timetables (id, day, period, subject, room_number, branch, semester, time, type, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(COALESCE(day, '')) || ', ' ||
       period || ', ' ||
       quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(room_number, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(COALESCE(time, '')) || ', ' ||
       quote_literal(COALESCE(type, 'class')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.timetables;

-- ===========================================
-- STEP 7: Extract subjects
-- ===========================================

SELECT 'INSERT INTO public.subjects (id, name, code, branch, semester, credits, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(COALESCE(name, '')) || ', ' ||
       quote_literal(COALESCE(code, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       credits || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.subjects;

-- ===========================================
-- STEP 8: Extract groups
-- ===========================================

SELECT 'INSERT INTO public.groups (id, name, description, created_by, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(COALESCE(name, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       quote_literal(created_by) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.groups;

-- ===========================================
-- STEP 9: Extract group_members
-- ===========================================

SELECT 'INSERT INTO public.group_members (id, group_id, user_id, role, joined_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(group_id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(role, 'member')) || ', ' ||
       quote_literal(joined_at) || ');' as sql_statement
FROM public.group_members;

-- ===========================================
-- STEP 10: Extract group_messages
-- ===========================================

SELECT 'INSERT INTO public.group_messages (id, group_id, user_id, content, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(group_id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(content, '')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.group_messages;

-- ===========================================
-- STEP 11: Extract messages
-- ===========================================

SELECT 'INSERT INTO public.messages (id, sender_id, receiver_id, content, is_read, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(sender_id) || ', ' ||
       quote_literal(receiver_id) || ', ' ||
       quote_literal(COALESCE(content, '')) || ', ' ||
       CASE WHEN is_read THEN 'true' ELSE 'false' END || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.messages;

-- ===========================================
-- STEP 12: Extract study_materials
-- ===========================================

SELECT 'INSERT INTO public.study_materials (id, title, content, subject, branch, semester, uploaded_by, file_url, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(content, '')) || ', ' ||
       quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(uploaded_by) || ', ' ||
       quote_literal(COALESCE(file_url, '')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.study_materials;

-- ===========================================
-- STEP 13: Extract job_postings
-- ===========================================

SELECT 'INSERT INTO public.job_postings (id, title, company, description, requirements, salary_range, location, posted_by, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(company, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       quote_literal(COALESCE(requirements, '')) || ', ' ||
       quote_literal(COALESCE(salary_range, '')) || ', ' ||
       quote_literal(COALESCE(location, '')) || ', ' ||
       quote_literal(posted_by) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.job_postings;

-- ===========================================
-- STEP 14: Extract mentorship_requests
-- ===========================================

SELECT 'INSERT INTO public.mentorship_requests (id, student_id, mentor_id, subject, message, status, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(student_id) || ', ' ||
       quote_literal(mentor_id) || ', ' ||
       quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(message, '')) || ', ' ||
       quote_literal(COALESCE(status, 'pending')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.mentorship_requests;

-- ===========================================
-- STEP 15: Extract fundraising_campaigns
-- ===========================================

SELECT 'INSERT INTO public.fundraising_campaigns (id, title, description, target_amount, current_amount, created_by, deadline, status, created_at, updated_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       quote_literal(target_amount) || ', ' ||
       quote_literal(current_amount) || ', ' ||
       quote_literal(created_by) || ', ' ||
       CASE WHEN deadline IS NOT NULL THEN quote_literal(deadline) ELSE 'NULL' END || ', ' ||
       quote_literal(COALESCE(status, 'active')) || ', ' ||
       quote_literal(created_at) || ', ' ||
       quote_literal(updated_at) || ');' as sql_statement
FROM public.fundraising_campaigns;

-- ===========================================
-- STEP 16: Extract student_fundraising_status
-- ===========================================

SELECT 'INSERT INTO public.student_fundraising_status (id, student_id, campaign_id, amount_pledged, amount_paid, status, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(student_id) || ', ' ||
       quote_literal(campaign_id) || ', ' ||
       quote_literal(amount_pledged) || ', ' ||
       quote_literal(amount_paid) || ', ' ||
       quote_literal(COALESCE(status, 'pending')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.student_fundraising_status;

-- ===========================================
-- STEP 17: Extract admin_settings
-- ===========================================

SELECT 'INSERT INTO public.admin_settings (id, setting_key, setting_value, created_at, updated_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(setting_key) || ', ' ||
       quote_literal(setting_value::text) || ', ' ||
       quote_literal(created_at) || ', ' ||
       quote_literal(updated_at) || ');' as sql_statement
FROM public.admin_settings;

-- ===========================================
-- STEP 18: Extract site_settings
-- ===========================================

SELECT 'INSERT INTO public.site_settings (id, setting_key, setting_value, created_at, updated_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(setting_key) || ', ' ||
       quote_literal(setting_value::text) || ', ' ||
       quote_literal(created_at) || ', ' ||
       quote_literal(updated_at) || ');' as sql_statement
FROM public.site_settings;

-- ===========================================
-- STEP 19: Extract notifications
-- ===========================================

SELECT 'INSERT INTO public.notifications (id, user_id, title, message, type, is_read, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(message, '')) || ', ' ||
       quote_literal(COALESCE(type, 'info')) || ', ' ||
       CASE WHEN is_read THEN 'true' ELSE 'false' END || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.notifications;

-- ===========================================
-- STEP 20: Extract reports
-- ===========================================

SELECT 'INSERT INTO public.reports (id, reported_by, reported_user, report_type, description, status, created_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(reported_by) || ', ' ||
       quote_literal(reported_user) || ', ' ||
       quote_literal(COALESCE(report_type, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       quote_literal(COALESCE(status, 'pending')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.reports;

-- ===========================================
-- STEP 21: Extract drafts
-- ===========================================

SELECT 'INSERT INTO public.drafts (id, user_id, title, content, type, created_at, updated_at) VALUES (' ||
       quote_literal(id) || ', ' ||
       quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(content, '')) || ', ' ||
       quote_literal(COALESCE(type, '')) || ', ' ||
       quote_literal(created_at) || ', ' ||
       quote_literal(updated_at) || ');' as sql_statement
FROM public.drafts;

-- ===========================================
-- STEP 22: Extract branches
-- ===========================================

SELECT 'INSERT INTO public.branches (id, name, code, created_at) VALUES (' ||
       id || ', ' ||
       quote_literal(COALESCE(name, '')) || ', ' ||
       quote_literal(COALESCE(code, '')) || ', ' ||
       quote_literal(created_at) || ');' as sql_statement
FROM public.branches;

-- ===========================================
-- HOW TO USE THESE QUERIES:
-- ===========================================
--
-- 1. Run each SELECT query above in your CURRENT Supabase project
-- 2. Copy the generated INSERT statements from the results
-- 3. Paste them into your NEW Supabase project
-- 4. Run the INSERT statements
--
-- This will migrate ALL your data rows from old to new database!
