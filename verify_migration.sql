-- CERA MIGRATION VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to check your migration

-- Check table existence and counts
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'user_profiles',
    'user_preferences',
    'fee_records',
    'attendance_records',
    'assignments',
    'timetables',
    'subjects',
    'groups',
    'group_members',
    'group_messages',
    'messages',
    'study_materials',
    'job_postings',
    'mentorship_requests',
    'fundraising_campaigns',
    'student_fundraising_status',
    'admin_settings',
    'site_settings',
    'notifications',
    'reports',
    'drafts',
    'branches'
)
ORDER BY tablename;

-- Check data counts (run after adding data)
SELECT 'user_profiles' as table_name, COUNT(*) as count FROM public.user_profiles
UNION ALL
SELECT 'fee_records', COUNT(*) FROM public.fee_records
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM public.attendance_records
UNION ALL
SELECT 'assignments', COUNT(*) FROM public.assignments
UNION ALL
SELECT 'timetables', COUNT(*) FROM public.timetables;

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
