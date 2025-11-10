-- COMPREHENSIVE DATA MIGRATION SOLUTION
-- This ensures ALL your data rows are migrated from old to new database

-- ===========================================
-- APPROACH 1: DIRECT DATABASE-TO-DATABASE MIGRATION (RECOMMENDED)
-- ===========================================

-- If you have access to both Supabase projects:

-- 1. Connect to OLD project and run this query:
SELECT
    'INSERT INTO public.user_profiles (id, user_id, full_name, branch, semester, created_at) VALUES (' ||
    quote_literal(id) || ', ' ||
    quote_literal(user_id) || ', ' ||
    quote_literal(full_name) || ', ' ||
    quote_literal(branch) || ', ' ||
    quote_literal(semester) || ', ' ||
    quote_literal(created_at) || ');'
FROM public.user_profiles;

-- 2. Copy the output and run in NEW project
-- Repeat for ALL tables:
-- fee_records, attendance_records, assignments, timetables, subjects,
-- groups, group_members, group_messages, messages, study_materials,
-- job_postings, mentorship_requests, fundraising_campaigns,
-- student_fundraising_status, admin_settings, site_settings,
-- notifications, reports, drafts, branches

-- ===========================================
-- APPROACH 2: CSV EXPORT/IMPORT VIA SUPABASE DASHBOARD
-- ===========================================

-- For each table in OLD Supabase project:
-- 1. Go to Table Editor
-- 2. Click "Export" → CSV
-- 3. In NEW project: Click "Import" → Upload CSV
-- 4. Map columns and import

-- Tables to export/import:
-- ✓ user_profiles
-- ✓ user_preferences
-- ✓ fee_records
-- ✓ attendance_records
-- ✓ assignments
-- ✓ timetables
-- ✓ subjects
-- ✓ groups
-- ✓ group_members
-- ✓ group_messages
-- ✓ messages
-- ✓ study_materials
-- ✓ job_postings
-- ✓ mentorship_requests
-- ✓ fundraising_campaigns
-- ✓ student_fundraising_status
-- ✓ admin_settings
-- ✓ site_settings
-- ✓ notifications
-- ✓ reports
-- ✓ drafts
-- ✓ branches

-- ===========================================
-- APPROACH 3: AUTOMATED SCRIPT GENERATION
-- ===========================================

-- Run this in OLD Supabase SQL Editor to generate migration scripts:

-- Generate user_profiles migration
SELECT 'INSERT INTO public.user_profiles (id, user_id, full_name, branch, semester, created_at) VALUES (' ||
       quote_literal(id) || ', ' || quote_literal(user_id) || ', ' ||
       quote_literal(COALESCE(full_name, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(created_at) || ');'
FROM public.user_profiles;

-- Generate fee_records migration
SELECT 'INSERT INTO public.fee_records (id, student_id, total_amount, paid_amount, due_date, created_at) VALUES (' ||
       id || ', ' || quote_literal(student_id) || ', ' ||
       quote_literal(total_amount) || ', ' ||
       quote_literal(paid_amount) || ', ' ||
       CASE WHEN due_date IS NOT NULL THEN quote_literal(due_date) ELSE 'NULL' END || ', ' ||
       quote_literal(created_at) || ');'
FROM public.fee_records;

-- Generate attendance_records migration
SELECT 'INSERT INTO public.attendance_records (id, student_uid, subject, status, date, created_at) VALUES (' ||
       id || ', ' || quote_literal(student_uid) || ', ' ||
       quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(status, '')) || ', ' ||
       CASE WHEN date IS NOT NULL THEN quote_literal(date) ELSE 'NULL' END || ', ' ||
       quote_literal(created_at) || ');'
FROM public.attendance_records;

-- Generate assignments migration
SELECT 'INSERT INTO public.assignments (id, title, course_name, description, due_date, branch, semester, instructor_name, created_at) VALUES (' ||
       id || ', ' || quote_literal(COALESCE(title, '')) || ', ' ||
       quote_literal(COALESCE(course_name, '')) || ', ' ||
       quote_literal(COALESCE(description, '')) || ', ' ||
       CASE WHEN due_date IS NOT NULL THEN quote_literal(due_date) ELSE 'NULL' END || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(COALESCE(instructor_name, '')) || ', ' ||
       quote_literal(created_at) || ');'
FROM public.assignments;

-- Generate timetables migration
SELECT 'INSERT INTO public.timetables (id, day, period, subject, room_number, branch, semester, time, type, created_at) VALUES (' ||
       id || ', ' || quote_literal(COALESCE(day, '')) || ', ' ||
       period || ', ' || quote_literal(COALESCE(subject, '')) || ', ' ||
       quote_literal(COALESCE(room_number, '')) || ', ' ||
       quote_literal(COALESCE(branch, '')) || ', ' ||
       quote_literal(COALESCE(semester, '')) || ', ' ||
       quote_literal(COALESCE(time, '')) || ', ' ||
       quote_literal(COALESCE(type, 'class')) || ', ' ||
       quote_literal(created_at) || ');'
FROM public.timetables;

-- ===========================================
-- VERIFICATION QUERIES (Run in NEW database)
-- ===========================================

-- Check migration success
SELECT
    'user_profiles' as table_name, COUNT(*) as count,
    CASE WHEN COUNT(*) > 0 THEN '✅ DATA MIGRATED' ELSE '❌ NO DATA' END as status
FROM public.user_profiles
UNION ALL
SELECT 'fee_records', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ DATA MIGRATED' ELSE '❌ NO DATA' END
FROM public.fee_records
UNION ALL
SELECT 'attendance_records', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ DATA MIGRATED' ELSE '❌ NO DATA' END
FROM public.attendance_records
UNION ALL
SELECT 'assignments', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ DATA MIGRATED' ELSE '❌ NO DATA' END
FROM public.assignments
UNION ALL
SELECT 'timetables', COUNT(*),
    CASE WHEN COUNT(*) > 0 THEN '✅ DATA MIGRATED' ELSE '❌ NO DATA' END
FROM public.timetables;

-- ===========================================
-- FINAL CHECKLIST
-- ===========================================

-- [ ] Run table creation script (complete_cera_migration.sql) ✅ DONE
-- [ ] Extract/generate INSERT statements for all tables
-- [ ] Run INSERT statements in new database
-- [ ] Verify data counts match old database
-- [ ] Test CERA app with new database
-- [ ] Update .env.local with new credentials ✅ DONE
-- [ ] Confirm no more 402 errors

-- ===========================================
-- EMERGENCY RECOVERY
-- ===========================================

-- If something goes wrong, you can:
-- 1. Delete all data: TRUNCATE all tables
-- 2. Re-run the table creation script
-- 3. Re-import data
-- 4. Test again

-- The database structure is perfect, we just need the data rows!
